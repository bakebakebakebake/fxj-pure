---
title: '11 性能与基准测试'
description: '结合 Go 基准、Python 对比脚本和 k6 压测脚本，建立一套可复现的性能评估口径。'
order: 11
source: 'agent-memory'
sourceTitle: 'Agent Memory 文档'
section: 'teaching'
sectionTitle: '教学路径'
language: 'zh'
tags: ['docs', 'agent-memory', 'teaching']
---
## 前置知识

- [04 Go 服务端指南](04-go-server-guide.md)
- [05 Python SDK 指南](05-python-sdk-guide.md)

## 本文目标

完成阅读后，你将理解：

1. 当前项目已经有哪些性能测试资产
2. Go 原生 benchmark 的最新结果是什么
3. Go 服务与 Python 嵌入后端在小规模和中规模数据上的差异
4. k6 脚本适合回答什么问题

## 为什么性能评估要分三层

这个项目不是只有一种运行方式，所以性能评估也不能只看一个数字。

当前仓库把性能评估拆成三层：

1. **Go 原生 benchmark**：看单个模块和接口路径的裸性能；
2. **Python vs Go 对比脚本**：看两种运行模式在同一批数据下的端到端表现；
3. **k6 负载测试**：看服务模式在并发压力下的稳定性。

这三层解决的问题不同：

- benchmark 回答“函数本身多快”；
- compare 脚本回答“用户真的调用时哪条链路更快”；
- k6 回答“多人同时打时会怎样”。

## Go 基准测试方法论

计划要求这里详细解释 `b.ResetTimer()` 和 `b.ReportAllocs()` 的作用。

### `b.ReportAllocs()`

作用：把每次操作的内存分配情况也输出出来。  
这样你看到的结果不只是 `ns/op`，还会有：

- `B/op`
- `allocs/op`

这很重要，因为很多优化不是为了让时间瞬间减少 10 倍，而是为了降低中间对象和 GC 压力。

### `b.ResetTimer()`

作用：把前面的准备时间从基准统计里剔除掉。

例如在 `BenchmarkGetMemory`、`BenchmarkSearchFullText` 里，都会先通过 `populateBenchMemories(...)` 预填充 100 条数据。  
如果不在预填充之后调用 `b.ResetTimer()`，你测到的就会是“准备数据 + 执行查询”的混合时间，这样结果会失真。

### 预填充策略为什么重要

文件：`go-server/internal/storage/sqlite_bench_test.go:22`

```go
func populateBenchMemories(b testing.TB, backend *Backend, count int) {
	b.Helper()
	ctx := context.Background()
	for index := 0; index < count; index++ {
		item := buildMemory(fmt.Sprintf("bench-%d", index), fmt.Sprintf("SQLite memory %d for agent benchmarks", index), "")
		item.Embedding = []float32{float32(index%7 + 1), 0.2, 0.3}
		item.Tags = []string{"sqlite", "agent", fmt.Sprintf("tag-%d", index%5)}
		item.EntityRefs = []string{"sqlite", "agent", fmt.Sprintf("entity-%d", index%4)}
		if index > 0 {
			item.CausalParentId = fmt.Sprintf("bench-%d", index-1)
		}
		if _, err := backend.AddMemory(ctx, item); err != nil {
			b.Fatal(err)
		}
	}
}
```

这段预填充不是随便造数据，它故意同时带上：

- 向量差异；
- 标签分布；
- 实体分布；
- 因果链。

这样一来，全文检索、实体检索、向量检索和祖先追踪都能在同一套测试数据上跑。

## Go 原生 benchmark 结果

本次新增的基准包括：

- `BenchmarkAddMemory`
- `BenchmarkGetMemory`
- `BenchmarkSearchFullText`
- `BenchmarkSearchByVector`
- `BenchmarkSearchByEntities`
- `BenchmarkSoftDeleteMemory`
- `BenchmarkTraceAncestors`
- `BenchmarkHealthSnapshot`
- `BenchmarkOrchestratorSearch`
- `BenchmarkRouterClassify`
- `BenchmarkReciprocalRankFusion`

### 最新结果

测试环境：

- 日期：`2026-03-25`
- 系统：`darwin / arm64`
- CPU：`Apple M4`

| Benchmark | 结果 |
|-----------|------|
| `BenchmarkRouterClassify` | `211.9 ns/op`, `64 B/op`, `1 allocs/op` |
| `BenchmarkReciprocalRankFusion` | `1044 ns/op`, `1296 B/op`, `11 allocs/op` |
| `BenchmarkOrchestratorSearch` | `661156 ns/op`, `213603 B/op`, `6581 allocs/op` |
| `BenchmarkAddMemory` | `40031 ns/op`, `7320 B/op`, `154 allocs/op` |
| `BenchmarkGetMemory` | `12634 ns/op`, `3833 B/op`, `129 allocs/op` |
| `BenchmarkSearchFullText` | `135832 ns/op`, `26665 B/op`, `755 allocs/op` |
| `BenchmarkSearchByVector` | `376868 ns/op`, `192908 B/op`, `5976 allocs/op` |
| `BenchmarkSearchByEntities` | `223968 ns/op`, `22221 B/op`, `686 allocs/op` |
| `BenchmarkSoftDeleteMemory` | `36848 ns/op`, `2266 B/op`, `62 allocs/op` |
| `BenchmarkTraceAncestors` | `73801 ns/op`, `16592 B/op`, `533 allocs/op` |
| `BenchmarkHealthSnapshot` | `39077 ns/op`, `2072 B/op`, `58 allocs/op` |

## 如何读这些数字

### 1. Router 和 RRF 很轻

`RouterClassify` 和 `ReciprocalRankFusion` 都处在纳秒到微秒级，说明纯规则判断和排名融合本身不是系统瓶颈。

### 2. OrchestratorSearch 的主要成本不在“路由”

`BenchmarkOrchestratorSearch` 达到 `661156 ns/op`，还伴随 `6581 allocs/op`。  
这说明真正的成本主要来自：

- 多路搜索调用；
- 中间结果 map / slice 构造；
- 结果刷新与排序。

所以如果要优化编排器，重点不该放在“换一套更复杂的意图分类”，而应放在减少中间结构和重复读取。

### 3. 向量检索比全文检索更贵

`SearchByVector` 的时间和分配都显著高于 `SearchFullText`。  
这和代码结构是对应的：Go 端当前向量检索是全量扫描 + 余弦计算，而全文检索只是对文本和标签做简单匹配与排序。

### 4. 祖先追踪并不算重

`TraceAncestors` 约 `73 µs/op`，说明递归 CTE 在当前数据规模下成本可控。  
这对于“记忆系统能否支持因果追溯”是个很积极的信号。

## Python vs Go 对比脚本

对比脚本是 **`benchmarks/compare_go_python.py`**。

运行命令：

```bash
PYTHONPATH=src .venv/bin/python benchmarks/compare_go_python.py --scales 100 1000
```

### 脚本如何保证公平

文件：`benchmarks/compare_go_python.py:139`

脚本会分别：

1. 创建一份 Python 本地 SQLite 库；
2. 创建一份 Go 服务使用的 SQLite 库；
3. 用同样的 `generate_items(scale, prefix)` 生成测试数据；
4. 分别测 `store`、`full-text`、`vector`、`entity`、`health` 五类操作。

这意味着它比较的是：

- **Python embedded 模式**
- **Go REST 服务模式**

而不是抽象的“语言快慢”。

### `measure()` 怎么算平均值

文件：`benchmarks/compare_go_python.py:69`

```python
def measure(runs: int, func: Callable[[], None]) -> float:
    started = time.perf_counter()
    for _ in range(runs):
        func()
    elapsed = time.perf_counter() - started
    return elapsed * 1000 / runs
```

也就是说，最终表格里的单位是 **毫秒 / 次调用平均值**。

## Go vs Python 最新结果

| Scale | Metric | Python (ms) | Go REST (ms) | Delta |
|------:|--------|------------:|-------------:|------:|
| 100 | Store | 0.24 | 0.53 | +0.30 |
| 100 | Full-text | 6.68 | 0.52 | -6.16 |
| 100 | Vector | 1.56 | 1.29 | -0.27 |
| 100 | Entity | 0.50 | 0.65 | +0.15 |
| 100 | Health | 0.08 | 0.33 | +0.25 |
| 1000 | Store | 0.26 | 0.72 | +0.46 |
| 1000 | Full-text | 242.78 | 1.20 | -241.57 |
| 1000 | Vector | 21.76 | 11.72 | -10.05 |
| 1000 | Entity | 3.92 | 3.51 | -0.41 |
| 1000 | Health | 1.16 | 0.89 | -0.27 |

## 结果深入解读

计划要求这里不能只报表格，还要把原因讲清楚。

### 为什么 Python 小规模写入更快

`Store` 在 `100` 和 `1000` 规模下都是 Python 更快，原因比较直接：

1. Python embedded 模式是进程内调用，没有 HTTP 序列化和网络栈；
2. Go 路径即使服务和客户端在同机，也要走 JSON 编码、HTTP 请求、handler 解析和响应反序列化；
3. 小规模写入时，协议开销比数据库本身更显眼。

所以这里体现的不是“Python 存储引擎绝对更强”，而是“本地直连路径在轻量写入下很占便宜”。

### 为什么 Go 在向量检索上更快

`Vector` 在 `1000` 规模下 Go 优势已经比较明显。  
结合代码可以做出一个比较稳妥的解释：

1. 两边当前都包含全量扫描 / 余弦计算的回退路径；
2. Go 端余弦计算和排序在这组规模上开销更低；
3. Python 端对象构造、JSON 反序列化和解释器层循环成本更高。

这是从源码和结果推出来的工程解释。

### 为什么 Go 的全文检索结果非常好看

这里要特别谨慎，不能机械套用一个错误解释。

从源码看：

- Python 端 `search_full_text()` 使用了 FTS5 + `bm25(...)`；
- Go 端 `SearchFullText()` 当前走的是 `LOWER(content) LIKE ?` 与 `lexicalScore()`。

但在当前对比脚本的数据和规模下，Go 结果明显更快。更合理的解释是：

1. 这组基准数据规模仍然不大，且文本模式非常规则；
2. Go 侧字符串匹配路径更直接，返回结构也更轻；
3. Python 端 FTS 查询、结果 join 和对象还原的固定成本在这组小到中等规模数据上更突出。

所以这里不能简单说成“某个数据库特性天然比另一个快”。  
更准确的说法是：

> 在当前这套数据分布和规模下，Go 的全文搜索链路表现更好；如果数据量、查询复杂度和索引策略变化，结论也可能变化。

### 为什么 Health 在不同规模下差异不大

`Health` 的 SQL 主要是聚合查询：

- 总数
- 平均 trust
- stale ratio
- orphan ratio
- unresolved conflicts
- audit count

这类查询虽然会随数据量增长，但增长曲线不像向量扫描那么陡，所以两端差异总体更温和。

## k6 负载测试回答什么问题

仓库提供：

- `benchmarks/k6/http-load.js`
- `benchmarks/k6/grpc-load.js`
- `benchmarks/k6/README.md`

它们更适合回答：

1. 并发上来后，服务是否稳定；
2. p95 / p99 延迟怎么变化；
3. HTTP 与 gRPC 哪条链路更适合当前负载。

如果 benchmark 更像“显微镜”，k6 更像“压力舱”。

## 当前瓶颈观察

从最新结果看，当前更值得关注的点有：

### 1. Go 向量检索仍然是主要瓶颈

Go 服务端当前没有接 `sqlite-vec`，所以向量检索要扫全表并做余弦计算。  
数据量继续上去后，这条路径成本会继续抬升。

### 2. 编排器分配次数偏多

`BenchmarkOrchestratorSearch` 的 `allocs/op` 很高，说明这里仍有不少中间 map、slice 和结果刷新带来的对象开销。

### 3. Python embedded 模式的优势主要集中在轻量调用

像 `store`、小规模本地操作，Python 路径非常顺手；  
但一旦进入更重的查询与融合流程，Go 服务模式的收益会更明显。

## 如何继续做性能优化

如果按收益优先级排，后续优化可以考虑：

1. **Go 向量检索加索引化**：接入 `sqlite-vec` 或其他更合适的近邻索引；
2. **编排器减少中间对象**：降低 `allocs/op`；
3. **Python FTS 查询路径再剖析**：确认当前基准中固定成本来自哪里；
4. **扩大 compare 脚本的数据规模**：把 `10000` 规模也纳入持续评估。

## 小结

- 项目已经具备 Go benchmark、Python 对比脚本和 k6 压测三类性能资产
- `b.ReportAllocs()` 与 `b.ResetTimer()` 保证了基准结果更可解释
- Python embedded 模式在轻量写入上很有优势
- Go 服务模式在当前中等规模检索上整体更强，尤其是向量与全文查询路径
- 真正最值得优先优化的仍是 Go 端向量检索和编排器中间分配

## 延伸阅读

- [07 数据库与 Schema 指南](07-database-schema-guide.md)
- [10 测试与质量指南](10-testing-quality-guide.md)
- `/Users/xjf/Public/Code/Agent-Project/docs/benchmark-results.md`
