---
title: '10 测试与质量指南'
description: '从测试分层、Go 补测、基准测试和 CI 四个角度，讲清项目如何保障质量。'
order: 10
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

1. Python 与 Go 的测试分别覆盖哪些层次
2. 这次补充了哪些 Go 测试与基准
3. 如何本地运行测试、基准和对比脚本
4. CI 当前验证了哪些内容

## 测试架构总览

项目现在有两套测试面：

- **Python**：偏 SDK、后端、MCP 和集成行为
- **Go**：偏服务端、编排器、认证、治理和存储实现

当前仓库里，已有的 Python 测试函数是 **43** 个；Go 端测试与基准函数合计 **31** 个。  
这组数字本身就很适合面试里直接说，因为它能说明这个项目不是“只写代码不写验证”。

## Python 测试基础设施

计划要求这里要把 `conftest.py` 的 fixture 代码放出来解释。

文件：`tests/conftest.py:1`

```python
from __future__ import annotations

import pytest

from agent_memory import MemoryClient
from agent_memory.config import AgentMemoryConfig
from agent_memory.storage.sqlite_backend import SQLiteBackend


class DummyEmbeddingProvider:
    dimension = 3

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [[1.0, float(index + 1), float(len(text))] for index, text in enumerate(texts)]


@pytest.fixture
def backend() -> SQLiteBackend:
    return SQLiteBackend(":memory:")


@pytest.fixture
def client(backend: SQLiteBackend) -> MemoryClient:
    return MemoryClient(
        config=AgentMemoryConfig(database_path=":memory:"),
        backend=backend,
        embedding_provider=DummyEmbeddingProvider(),
    )


@pytest.fixture
def tmp_db_path(tmp_path) -> str:
    return str(tmp_path / "test.db")
```

这段基础设施有三个关键点：

1. `DummyEmbeddingProvider` 不会去下载真实模型，也不依赖外部 API，测试环境稳定很多。
2. `backend()` fixture 默认使用 `SQLiteBackend(":memory:")`，所以大部分测试能在内存数据库里跑完，速度快，隔离也好。
3. `client()` fixture 把自定义 backend 和 dummy embedding provider 注入 `MemoryClient`，从而测试时完全不依赖生产配置。

### 为什么 dummy embedding 要这样写

`embed()` 返回的向量：

```python
[1.0, float(index + 1), float(len(text))]
```

它不是为了模拟真实 embedding 质量，而是为了让测试满足两个条件：

1. 向量维度稳定；
2. 对不同文本仍有可区分性。

这就是测试里很典型的思路：只保留被测逻辑真正需要的差异，别把不必要的复杂性引进来。

## Go 测试基础设施

### `buildMemory()` helper

文件：`go-server/internal/storage/sqlite_test.go:11`

```go
func buildMemory(memoryID string, content string, parentID string) *memoryv1.MemoryItem {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	entities := []string{"agent"}
	if content == "SQLite works well for local agent memory" {
		entities = append(entities, "sqlite")
	}
	return &memoryv1.MemoryItem{
		Id:             memoryID,
		Content:        content,
		MemoryType:     "semantic",
		Embedding:      []float32{0.1, 0.2, 0.3},
		CreatedAt:      now,
		LastAccessed:   now,
		SourceId:       "go-test",
		CausalParentId: parentID,
		EntityRefs:     entities,
		Tags:           []string{"test"},
		Layer:          "short_term",
		DecayRate:      0.1,
		TrustScore:     0.75,
		Importance:     0.5,
	}
}
```

这个 helper 的价值在于：

1. 每个测试都能快速拿到结构完整的 `MemoryItem`；
2. 时间、向量、层级、信任分这些默认值统一了，测试主体更聚焦；
3. `parentID` 参数让追踪链路测试写起来很自然。

### `newBenchBackend()` helper

文件：`go-server/internal/storage/sqlite_bench_test.go:12`

```go
func newBenchBackend(b testing.TB) *Backend {
	b.Helper()
	backend, err := New(":memory:")
	if err != nil {
		b.Fatal(err)
	}
	b.Cleanup(func() { _ = backend.Close() })
	return backend
}
```

这个 helper 专门服务基准测试：

1. 一律使用内存 SQLite，减少磁盘因素干扰；
2. `b.Cleanup(...)` 保证资源收口；
3. `b.Helper()` 让出错定位更准确，错误行会落到调用方而不是 helper 自己。

## Go 测试覆盖了什么

当前 Go 侧主要测试文件包括：

- `go-server/internal/search/orchestrator_test.go`
- `go-server/internal/auth/jwt_test.go`
- `go-server/internal/auth/apikey_test.go`
- `go-server/internal/config/config_test.go`
- `go-server/internal/governance/health_test.go`
- `go-server/internal/governance/export_test.go`
- `go-server/internal/storage/sqlite_test.go`
- `go-server/internal/controller/forgetting_test.go`
- `go-server/internal/controller/trust_test.go`
- `go-server/internal/controller/router_test.go`
- `go-server/internal/grpc/server_test.go`
- `go-server/internal/gateway/handler_test.go`

它们大致可以分成四层。

### 1. 规则层单元测试

关注单个函数或控制器规则：

- 路由分类
- RRF
- forgetting policy
- trust scorer

### 2. 存储层集成测试

关注 SQLite backend 的完整行为：

- 新增
- 更新
- 查询
- 删除
- 追踪
- 关系
- 演化日志
- 审计日志

### 3. 协议层测试

关注 HTTP 与 gRPC 是否把业务逻辑正确暴露出去：

- REST 路由
- 鉴权
- gRPC RPC

### 4. 基准测试

关注：

- 延迟
- 吞吐
- 分配
- 不同语言路径的对比

## 一个完整的 Go 集成测试长什么样

文件：`go-server/internal/storage/sqlite_test.go:69`

```go
func TestBackendUpdateTraceRelationsAndGovernance(t *testing.T) {
	backend, err := New(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer backend.Close()

	ctx := context.Background()
	root := buildMemory("root", "SQLite is the storage layer", "")
	child := buildMemory("child", "Go service exposes REST and gRPC", "root")
	leaf := buildMemory("leaf", "The client queries through fused search", "child")
	for _, item := range []*memoryv1.MemoryItem{root, child, leaf} {
		if _, err := backend.AddMemory(ctx, item); err != nil {
			t.Fatal(err)
		}
	}

	child.Content = "Go service exposes REST, gRPC, and auth middleware"
	child.Tags = append(child.Tags, "updated")
	if _, err := backend.UpdateMemory(ctx, child); err != nil {
		t.Fatal(err)
	}
	updated, err := backend.GetMemory(ctx, "child")
	if err != nil {
		t.Fatal(err)
	}
	if updated == nil || updated.Content != child.Content {
		t.Fatalf("unexpected updated memory: %#v", updated)
	}

	ancestors, err := backend.TraceAncestors(ctx, "leaf", 5)
	if err != nil {
		t.Fatal(err)
	}
	if len(ancestors) != 2 || ancestors[0].Id != "child" || ancestors[1].Id != "root" {
		t.Fatalf("unexpected ancestors: %#v", ancestors)
	}

	descendants, err := backend.TraceDescendants(ctx, "root", 5)
	if err != nil {
		t.Fatal(err)
	}
	if len(descendants) != 2 || descendants[0].Id != "child" || descendants[1].Id != "leaf" {
		t.Fatalf("unexpected descendants: %#v", descendants)
	}

	created, err := backend.AddRelation(ctx, &memoryv1.RelationEdge{
		SourceId:     "root",
		TargetId:     "leaf",
		RelationType: "supports",
		CreatedAt:    time.Now().UTC().Format(time.RFC3339Nano),
	})
	if err != nil {
		t.Fatal(err)
	}
	if !created {
		t.Fatal("expected relation to be created")
	}
	// ... 后续继续验证 relation exists、evolution、audit、health
}
```

这类测试的好处是一次覆盖整条业务链，但注意它仍然保持了“每一步断言都很清楚”。  
它不是一坨黑盒 E2E，而是结构化集成测试。

## 基准测试方法论

计划要求性能章节里讲方法论，但测试章节也要先把基准的写法说明白。

### `populateBenchMemories()`

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

这段预填充代码很有代表性：

1. 数据不是完全随机，而是带着可控的 tag、entity、causal chain 分布。
2. 这样可以同时服务全文检索、实体检索、向量检索和因果追踪。
3. 基准测到的结果更接近真实工作负载，而不是玩具样本。

### `b.ReportAllocs()` 与 `b.ResetTimer()`

以 `BenchmarkAddMemory` 为例：

文件：`go-server/internal/storage/sqlite_bench_test.go:39`

```go
func BenchmarkAddMemory(b *testing.B) {
	backend := newBenchBackend(b)
	ctx := context.Background()
	b.ReportAllocs()
	b.ResetTimer()
	for index := 0; index < b.N; index++ {
		item := buildMemory(fmt.Sprintf("add-%d", index), fmt.Sprintf("add benchmark %d", index), "")
		item.Embedding = []float32{0.1, 0.2, 0.3}
		if _, err := backend.AddMemory(ctx, item); err != nil {
			b.Fatal(err)
		}
	}
}
```

这里两句非常重要：

1. `b.ReportAllocs()` 会让基准结果包含内存分配统计，而不是只有耗时。
2. `b.ResetTimer()` 会把前面的准备时间清零，确保计时只覆盖真正的被测代码。

换句话说，像 `populateBenchMemories()` 这种预热动作应该放在 `ResetTimer()` 之前，不然测试数据准备时间会污染结果。

## 编写新测试的模板

计划要求这里给出完整模板，便于后续继续补测试。

### Python 测试模板

```python
from agent_memory.models import MemoryType


def test_search_returns_expected_memory(client):
    client.add("User prefers SQLite.", source_id="unit-test", memory_type=MemoryType.SEMANTIC)

    results = client.search("What database does the user prefer?", limit=3)

    assert results
    assert results[0].item.content == "User prefers SQLite."
    assert "semantic" in results[0].matched_by or "full_text" in results[0].matched_by
```

这个模板体现了 Python 侧常见风格：

1. 直接复用 `client` fixture；
2. 用非常短的输入准备一个明确场景；
3. 断言结果存在、内容对、来源合理。

### Go 测试模板

```go
func TestSomething(t *testing.T) {
	backend, err := New(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer backend.Close()

	ctx := context.Background()
	cases := []struct {
		name     string
		query    string
		expected string
	}{
		{name: "basic match", query: "SQLite", expected: "m1"},
	}

	if _, err := backend.AddMemory(ctx, buildMemory("m1", "SQLite works well for local agent memory", "")); err != nil {
		t.Fatal(err)
	}

	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			results, err := backend.SearchFullText(ctx, testCase.query, 5, "")
			if err != nil {
				t.Fatal(err)
			}
			if len(results) == 0 || results[0].Item.Id != testCase.expected {
				t.Fatalf("unexpected results: %#v", results)
			}
		})
	}
}
```

这个模板适合 Go 侧常见的 table-driven 风格：

1. 先准备共享测试数据；
2. 用 `cases` 列表组织输入和期望；
3. 每个 case 用 `t.Run(...)` 单独跑。

## 本地运行方式

### Go 测试

```bash
cd /Users/xjf/Public/Code/Agent-Project/go-server
go test ./...
```

### Go 基准

```bash
cd /Users/xjf/Public/Code/Agent-Project/go-server
go test -run=^$ -bench=. ./...
```

### Python 测试

```bash
cd /Users/xjf/Public/Code/Agent-Project
.venv/bin/python -m pytest -q
```

### Go / Python 对比

```bash
cd /Users/xjf/Public/Code/Agent-Project
PYTHONPATH=src .venv/bin/python benchmarks/compare_go_python.py
```

## CI 流水线关注什么

当前 CI 的主目标可以概括为两件事：

1. 保证 Python 包可测试、可构建；
2. 保证 Go 服务在普通测试和 `-race` 条件下都能通过。

这两层覆盖刚好对应项目的双语言结构。

## 质量策略总结

这个仓库的质量策略可以概括成一句话：

> 规则模块靠快速单测兜边界，协议和存储靠集成测试兜主链路，性能问题再交给基准测试看趋势。

这比只写一种类型的测试更稳，也更贴近真实工程需求。

## 小结

- Python 测试通过 `conftest.py` 把 embedding 和存储依赖降到了最小
- Go 侧通过 `buildMemory()`、`newBenchBackend()` 和 `populateBenchMemories()` 把测试与基准的样板代码收敛起来
- `b.ReportAllocs()` 和 `b.ResetTimer()` 是基准方法论里最关键的两步
- 如果后续继续扩展，最值得补的是更多服务级端到端测试和更细的失败场景回归用例

## 延伸阅读

- [04 Go 服务端指南](04-go-server-guide.md)
- [05 Python SDK 指南](05-python-sdk-guide.md)
- [11 性能与基准测试](11-performance-benchmarking.md)
