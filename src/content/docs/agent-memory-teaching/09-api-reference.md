---
title: '09 API 参考'
description: '汇总 REST、gRPC、Python SDK、CLI 和 MCP 的主要接口，作为查阅手册使用。'
order: 9
source: 'agent-memory'
sourceTitle: 'Agent Memory 文档'
section: 'teaching'
sectionTitle: '教学路径'
language: 'zh'
tags: ['docs', 'agent-memory', 'teaching']
---
## 前置知识

- 无

## 本文目标

完成阅读后，你将理解：

1. Go 服务当前暴露了哪些 REST 能力
2. gRPC `StorageService` 包含哪些 RPC
3. Python SDK、CLI 和 MCP 工具分别适合什么场景

## REST API

当前 HTTP 层路由注册在 **`go-server/internal/gateway/handler.go:40`**。核心路由如下：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康快照 |
| `GET` | `/metrics` | Prometheus 指标 |
| `GET` | `/api/v1/info` | 版本、构建信息、运行时长 |
| `POST` | `/api/v1/memories` | 新增记忆 |
| `GET` | `/api/v1/memories` | 列表查询 |
| `GET` | `/api/v1/memories/{id}` | 查询单条记忆 |
| `PUT` | `/api/v1/memories/{id}` | 更新记忆 |
| `DELETE` | `/api/v1/memories/{id}` | 软删除记忆 |
| `POST` | `/api/v1/search/full-text` | 全文检索 |
| `POST` | `/api/v1/search/entities` | 实体检索 |
| `POST` | `/api/v1/search/vector` | 向量检索 |
| `POST` | `/api/v1/search/query` | 融合检索 |
| `POST` | `/api/v1/touch` | 刷新访问时间 |
| `GET` | `/api/v1/trace/ancestors` | 追祖先链 |
| `GET` | `/api/v1/trace/descendants` | 追后代链 |
| `GET` | `/api/v1/relations` | 列关系 |
| `POST` | `/api/v1/relations` | 建关系 |
| `GET` | `/api/v1/relations/exists` | 判定关系是否存在 |
| `GET` | `/api/v1/evolution` | 读取演化事件 |
| `GET` | `/api/v1/audit` | 读取审计事件 |

### 统一状态码说明

虽然每个 handler 没有显式列出全部状态码，但当前接口族可以按下面理解：

| 状态码 | 何时出现 | 说明 |
|---|---|---|
| `200` | 普通查询、更新、删除成功 | 成功返回 JSON 结果 |
| `201` | 新建记忆、创建关系成功 | 资源已创建 |
| `400` | JSON 解析失败、参数格式错误 | 请求体或查询参数不合法 |
| `401` | API Key / JWT 校验失败 | 认证未通过 |
| `404` | 当前实现通常不单独返回 | 多数读接口会返回 `found=false`，而不是 404 |
| `500` | 存储、搜索、内部异常 | 服务端处理失败 |

这里有个细节：`GET /api/v1/memories/{id}` 当前返回 `200 + {"found": false}`，并没有走 404。  
这是一种明确的接口风格，方便 SDK 侧把“没找到”当普通分支处理。

## REST 重点端点字段表

计划要求至少覆盖三个端点的请求/响应字段表，这里按最常用的三个来展开。

### `POST /api/v1/memories`

处理逻辑在 **`go-server/internal/gateway/handler.go:104`**，请求体直接解到 `memoryv1.MemoryItem`。

#### 请求体字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 业务主键，通常由 Python SDK 生成 UUID |
| `content` | string | 是 | 记忆正文 |
| `memory_type` | string | 是 | 记忆类型，如 `semantic`、`episodic`、`procedural` |
| `embedding` | `number[]` | 是 | 向量表示，长度取决于 embedding 模型 |
| `created_at` | string | 是 | ISO 时间字符串 |
| `last_accessed` | string | 是 | 最近访问时间，初始通常与 `created_at` 相同 |
| `access_count` | integer | 否 | 访问次数，若 SDK 构造对象时未设定，一般为默认值 |
| `valid_from` | string | 否 | 生效开始时间，可为空串 |
| `valid_until` | string | 否 | 生效结束时间，可为空串 |
| `trust_score` | number | 是 | 初始信任分，范围通常在 `[0,1]` |
| `importance` | number | 是 | 重要性分数，范围通常在 `[0,1]` |
| `layer` | string | 是 | 记忆层级，如 `working`、`short_term`、`long_term` |
| `decay_rate` | number | 是 | 遗忘衰减参数 |
| `source_id` | string | 是 | 来源标识，如 `conversation:123` |
| `causal_parent_id` | string | 否 | 因果父记忆 id |
| `supersedes_id` | string | 否 | 被当前记忆覆盖的旧记忆 id |
| `entity_refs` | `string[]` | 否 | 实体列表 |
| `tags` | `string[]` | 否 | 标签列表 |
| `deleted_at` | string | 否 | 软删除时间，新增时通常为空 |

#### 响应体字段

成功返回 `201`，结构如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `item` | object | 刚刚写入的 `MemoryItem` 完整对象 |

其中 `item` 内部就是上面同样的 19 个字段。

#### 示例请求

```bash
curl -X POST http://127.0.0.1:8080/api/v1/memories \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"demo-1",
    "content":"SQLite works well for local-first agents.",
    "memory_type":"semantic",
    "embedding":[0.1,0.2,0.3],
    "created_at":"2026-03-25T00:00:00Z",
    "last_accessed":"2026-03-25T00:00:00Z",
    "access_count":0,
    "valid_from":"",
    "valid_until":"",
    "trust_score":0.8,
    "importance":0.6,
    "layer":"short_term",
    "decay_rate":0.1,
    "source_id":"demo",
    "causal_parent_id":"",
    "supersedes_id":"",
    "entity_refs":["sqlite","agent"],
    "tags":["demo"],
    "deleted_at":""
  }'
```

### `POST /api/v1/search/query`

处理逻辑在 **`go-server/internal/gateway/handler.go:242`**，这也是远程模式下 Python SDK 最常调用的接口。

#### 请求体字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `query` | string | 是 | 用户原始查询 |
| `embedding` | `number[]` | 是 | 查询向量，由 Python 侧提前生成 |
| `entities` | `string[]` | 否 | 从 query 中抽出的实体列表 |
| `limit` | integer | 否 | 最终返回条数，`0` 时服务端会回退到默认值 |

#### 响应体字段

成功返回 `200`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `results` | `object[]` | 搜索结果列表 |

`results[i]` 的内部字段如下：

| 字段 | 类型 | 说明 |
|---|---|---|
| `item` | object | 命中的 `MemoryItem` |
| `score` | number | RRF 融合后的最终分数 |
| `matched_by` | `string[]` | 命中来源，如 `semantic`、`full_text`、`entity`、`causal_trace` |

#### 示例请求

```bash
curl -X POST http://127.0.0.1:8080/api/v1/search/query \
  -H 'Content-Type: application/json' \
  -d '{"query":"为什么选择 SQLite","embedding":[0.1,0.2,0.3],"entities":["sqlite"],"limit":5}'
```

#### 语义说明

这个接口本身并不重新生成 embedding，也不做实体抽取。  
它假定调用方已经把这两项准备好，然后 Go 服务只负责策略编排、召回、融合和访问计数更新。

### `GET /api/v1/memories/{id}`

处理逻辑在 **`go-server/internal/gateway/handler.go:136`**。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 记忆主键 |

#### 响应体字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `found` | boolean | 是否找到该记忆 |
| `item` | object \| null | 找到时返回完整 `MemoryItem`，未找到时通常为空 |

这类返回适合 SDK 直接映射成 `MemoryItem | None`。

## 其他 REST 端点速查

| 路径 | 请求字段摘要 | 响应字段摘要 |
|---|---|---|
| `POST /api/v1/search/full-text` | `query`、`limit`、`memory_type` | `results[]` |
| `POST /api/v1/search/entities` | `entities`、`limit`、`memory_type` | `results[]` |
| `POST /api/v1/search/vector` | `embedding`、`limit`、`memory_type` | `results[]` |
| `POST /api/v1/touch` | `memory_id` | `ok` |
| `GET /api/v1/trace/ancestors` | `memory_id`、`max_depth` | `items[]` |
| `GET /api/v1/trace/descendants` | `memory_id`、`max_depth` | `items[]` |
| `POST /api/v1/relations` | `source_id`、`target_id`、`relation_type`、`created_at` | `created` |
| `GET /api/v1/relations` | `memory_id` 可选 | `items[]` |
| `GET /api/v1/relations/exists` | `left_id`、`right_id`、`relation_types` | `exists` |
| `GET /api/v1/evolution` | `memory_id`、`limit` | `items[]` |
| `GET /api/v1/audit` | `limit` | `items[]` |
| `GET /health` | 无 | `HealthSnapshot` |
| `GET /api/v1/info` | 无 | 版本、构建信息、Go 版本、启动时间等 |

### `/health` 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `total_memories` | integer | 当前有效记忆数 |
| `stale_ratio` | number | 长时间未访问记忆占比 |
| `orphan_ratio` | number | 孤立记忆占比 |
| `unresolved_conflicts` | integer | 当前冲突边数量 |
| `average_trust_score` | number | 平均信任分 |
| `audit_events` | integer | 审计事件总数 |
| `database_size_bytes` | integer | Go 服务端数据库文件大小 |

### `/api/v1/info` 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `version` | string | 构建版本 |
| `build.path` | string | 模块路径 |
| `build.settings` | object | `vcs.*` 构建信息 |
| `go_version` | string | Go 运行时版本 |
| `sqlite_vec_status` | string | Go 服务当前固定为 `not_applicable_in_go_server` |
| `vector_search_mode` | string | 当前为 `cosine_scan` |
| `started_at` | string | 服务启动时间 |
| `uptime_seconds` | number | 运行时长 |

## gRPC API

`StorageService` 定义在 **`proto/memory/v1/storage_service.proto:9`**，当前提供 18 个 RPC：

- `AddMemory`
- `GetMemory`
- `UpdateMemory`
- `DeleteMemory`
- `SearchQuery`
- `SearchFullText`
- `SearchByEntities`
- `SearchByVector`
- `TouchMemory`
- `TraceAncestors`
- `TraceDescendants`
- `ListMemories`
- `AddRelation`
- `ListRelations`
- `RelationExists`
- `GetEvolutionEvents`
- `GetAuditEvents`
- `HealthCheck`

### `AddMemory` 字段表

文件：`proto/memory/v1/storage_service.proto:30`

#### Request

| 字段 | 类型 | 说明 |
|---|---|---|
| `item` | `MemoryItem` | 待写入的完整记忆对象 |

#### Response

| 字段 | 类型 | 说明 |
|---|---|---|
| `item` | `MemoryItem` | 服务端写入后的对象 |

### `GetMemory` 字段表

#### Request

| 字段 | 类型 | 说明 |
|---|---|---|
| `memory_id` | `string` | 目标记忆 id |

#### Response

| 字段 | 类型 | 说明 |
|---|---|---|
| `found` | `bool` | 是否命中 |
| `item` | `MemoryItem` | 命中时返回对象 |

### `SearchQuery` 字段表

文件：`proto/memory/v1/storage_service.proto:54`

#### Request

| 字段 | 类型 | 说明 |
|---|---|---|
| `query` | `string` | 原始查询文本 |
| `embedding` | `repeated float` | 查询向量 |
| `entities` | `repeated string` | 实体列表 |
| `limit` | `int32` | 返回条数 |

#### Response

返回的是 `SearchResultList`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `results` | `repeated SearchResult` | 搜索结果列表 |

其中 `SearchResult` 在 **`proto/memory/v1/models.proto:36`** 定义：

| 字段 | 类型 | 说明 |
|---|---|---|
| `item` | `MemoryItem` | 命中的记忆 |
| `score` | `double` | 搜索分数 |
| `matched_by` | `repeated string` | 命中来源 |

### `TraceAncestors` 字段表

文件：`proto/memory/v1/storage_service.proto:83`

#### Request

| 字段 | 类型 | 说明 |
|---|---|---|
| `memory_id` | `string` | 起始记忆 id |
| `max_depth` | `int32` | 最大回溯深度 |

#### Response

| 字段 | 类型 | 说明 |
|---|---|---|
| `items` | `repeated MemoryItem` | 按深度顺序返回的祖先链 |

### 其他常用 RPC 速查

| RPC | Request 重点字段 | Response 重点字段 |
|---|---|---|
| `SearchFullText` | `query`、`limit`、`memory_type` | `results[]` |
| `SearchByEntities` | `entities`、`limit`、`memory_type` | `results[]` |
| `SearchByVector` | `embedding`、`limit`、`memory_type` | `results[]` |
| `TouchMemory` | `memory_id` | `value` |
| `ListMemories` | `include_deleted` | `items[]` |
| `AddRelation` | `edge` | `created` |
| `ListRelations` | `memory_id` | `items[]` |
| `RelationExists` | `left_id`、`right_id`、`relation_types` | `value` |
| `GetEvolutionEvents` | `memory_id`、`limit` | `items[]` |
| `GetAuditEvents` | `limit` | `items[]` |
| `HealthCheck` | 无 | `snapshot` |

### gRPC 示例：Python 调用

```python
response = stub.SearchQuery(
    storage_service_pb2.SearchQueryRequest(
        query="为什么选择 SQLite",
        embedding=[0.1, 0.2, 0.3],
        entities=["sqlite"],
        limit=5,
    )
)
```

## Python SDK 方法签名

`MemoryClient` 暴露的方法集中在 **`src/agent_memory/client.py`**。下面列出最常用公开方法的签名、参数和返回值。

### 核心方法

| 方法 | 签名 | 返回值 | 用途 |
|---|---|---|---|
| `add` | `add(content: str, *, source_id: str, memory_type: MemoryType | str = MemoryType.SEMANTIC, importance: float = 0.5, trust_score: float = 0.75, tags: list[str] \| None = None, entity_refs: list[str] \| None = None, causal_parent_id: str \| None = None, supersedes_id: str \| None = None)` | `MemoryItem` | 新增记忆 |
| `get` | `get(memory_id: str)` | `MemoryItem \| None` | 查询单条记忆 |
| `update` | `update(item: MemoryItem, **changes: object)` | `MemoryItem` | 更新记忆 |
| `delete` | `delete(memory_id: str)` | `bool` | 软删除 |
| `search` | `search(query: str, limit: int \| None = None)` | `list[SearchResult]` | 融合检索 |
| `trace` | `trace(memory_id: str, max_depth: int = 10)` | `list[MemoryItem]` | 只看祖先链 |
| `trace_graph` | `trace_graph(memory_id: str, max_depth: int = 10)` | `TraceReport` | 返回焦点、祖先、后代、关系、演化事件 |
| `ingest_conversation` | `ingest_conversation(turns: list[ConversationTurn], source_id: str)` | `list[MemoryItem]` | 从对话批量提取记忆 |
| `maintain` | `maintain()` | `MaintenanceReport` | 执行治理周期 |
| `health` | `health()` | `HealthReport` | 读取健康快照 |
| `audit_events` | `audit_events(limit: int = 50)` | `list[dict[str, object]]` | 审计日志 |
| `evolution_events` | `evolution_events(memory_id: str \| None = None, limit: int = 50)` | `list[dict[str, object]]` | 演化事件 |
| `export_jsonl` | `export_jsonl(path: str)` | `int` | 导出条数 |
| `import_jsonl` | `import_jsonl(path: str)` | `int` | 导入条数 |

这些方法已经覆盖了绝大多数应用集成场景。

## CLI 命令

### Python CLI：`agent-memory`

当前常用子命令包括：

- `store`
- `search`
- `trace`
- `evolution`
- `audit`
- `health`
- `maintain`
- `export`
- `import`

### Go CLI：`agent-memory-go`

Go 侧当前提供：

- `health`
- `store`
- `search`

Go CLI 更像轻量调试入口；Python CLI 更像完整用户入口。

## MCP 工具参数表

MCP 工具定义在 **`src/agent_memory/interfaces/mcp_server.py:48`**。计划要求每个工具补参数表，下面逐个列出。

| 工具名 | 参数 | 类型 | 说明 |
|---|---|---|---|
| `memory_store` | `content` | string | 记忆正文 |
| `memory_store` | `source_id` | string | 来源标识 |
| `memory_store` | `memory_type` | string | 记忆类型，默认 `semantic` |
| `memory_search` | `query` | string | 搜索问题 |
| `memory_search` | `limit` | integer | 返回条数，默认 `5` |
| `memory_ingest_conversation` | `turns` | `object[]` | 对话轮次列表，每项通常含 `role` 和 `content` |
| `memory_ingest_conversation` | `source_id` | string | 对话来源标识 |
| `memory_trace` | `memory_id` | string | 目标记忆 id |
| `memory_trace` | `max_depth` | integer | 最大追踪深度，默认 `10` |
| `memory_health` | 无 | - | 返回健康快照 |
| `memory_audit` | `limit` | integer | 审计条数，默认 `50` |
| `memory_evolution` | `memory_id` | string | 目标记忆 id |
| `memory_evolution` | `limit` | integer | 返回条数，默认 `50` |
| `memory_update` | `memory_id` | string | 目标记忆 id |
| `memory_update` | `content` | string | 新内容 |
| `memory_delete` | `memory_id` | string | 目标记忆 id |
| `memory_maintain` | 无 | - | 执行一次维护周期 |
| `memory_export` | `path` | string | 导出 JSONL 路径 |

### MCP 常见返回结构

| 工具名 | 返回字段 | 说明 |
|---|---|---|
| `memory_store` | `id`、`content`、`trust_score` | 新记忆的轻量信息 |
| `memory_search` | `id`、`content`、`score`、`matched_by` | 便于 Agent 直接消费 |
| `memory_trace` | `focus`、`ancestors`、`descendants`、`relations`、`evolution_events` | 可序列化图结构 |
| `memory_health` | 健康快照字段 | 便于外部探针读取 |
| `memory_maintain` | `promoted`、`demoted`、`decayed` 等 | 维护周期结果 |
| `memory_export` | `path`、`exported` | 导出路径与数量 |

### MCP 返回值风格

MCP 工具返回值整体偏轻量：

- `memory_store` 返回 `id`、`content`、`trust_score`
- `memory_search` 返回简化后的结果列表
- `memory_trace` 返回可序列化的图结构
- `memory_maintain` 返回 `MaintenanceReport` 的字典形式

这样设计的好处是便于 Agent 工具直接消费，不必处理过于臃肿的原始对象。

## 认证与错误处理速查

### HTTP 认证

当前服务模式支持两种材料：

- `X-API-Key: <key>`
- `Authorization: Bearer <jwt>`

只要命中其中一种即可通过。

### gRPC 认证

对应的 metadata 键是：

- `x-api-key`
- `authorization`

### 常见错误返回

| 场景 | REST 表现 | gRPC 表现 |
|---|---|---|
| 未认证 | `401 unauthorized` | `Unauthenticated` |
| JSON 解析失败 | `400` | request 无法解码 |
| 内部存储错误 | `500` | RPC error |
| 没查到对象 | `200 + found=false` | `found=false` |

这个速查表很适合调 SDK 或写集成代码时快速定位问题。

## 小结

- REST 层覆盖了写入、查询、检索、关系、治理与健康检查
- `POST /api/v1/memories`、`POST /api/v1/search/query`、`GET /api/v1/memories/{id}` 三个端点最值得优先掌握
- gRPC `StorageService` 与 REST 基本一一对应，适合强类型远程调用
- Python SDK 负责统一开发体验，MCP 工具则把这套能力进一步暴露给 Agent

## 延伸阅读

- [04 Go 服务端指南](04-go-server-guide.md)
- [05 Python SDK 指南](05-python-sdk-guide.md)
- [06 Protobuf 与 gRPC 通信](06-protobuf-grpc-guide.md)
