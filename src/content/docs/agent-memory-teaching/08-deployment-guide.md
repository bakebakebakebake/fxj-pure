---
title: '08 部署指南'
description: '从嵌入模式、服务模式到 Docker Compose，整理项目的部署与运行方式。'
order: 8
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

1. 如何部署嵌入模式
2. 如何用 Docker Compose 跑服务模式
3. 部署时需要关心哪些环境变量
4. 生产化使用时要注意哪些运维点

## 两种部署路线

这个项目从一开始就不是只有一种运行姿势。

### 路线 A：嵌入模式

特点：

- 只起 Python 进程
- 默认本地 SQLite
- 最少的运维动作

适合：

- 本地脚本
- 单机 Agent
- 教学演示
- 个人工作流

### 路线 B：服务模式

特点：

- Go 服务负责存储与协议层
- Python 侧作为远程客户端或 MCP 容器
- 有独立的 HTTP / gRPC 入口

适合：

- 需要多协议接入
- 想演示完整工程化能力
- 希望把 Python SDK 与存储服务分离

## 嵌入模式部署

最短路径：

```bash
pip install agent-memory-engine
```

然后直接调用：

```bash
agent-memory store "User prefers SQLite." --source-id demo
agent-memory search "What database does the user prefer?"
```

或者在代码里直接用：

```python
from agent_memory import MemoryClient

client = MemoryClient()
client.add("User prefers SQLite.", source_id="demo")
print(client.search("What database does the user prefer?"))
```

这一条路径不依赖额外服务，最适合先验证“数据结构、算法、治理逻辑是否跑通”。

## Docker Compose 完整走读

计划要求这一节必须把 `docker-compose.yml` 完整展示并解释。

文件：`deploy/docker-compose.yml:1`

```yaml
services:
  go-server:
    build:
      context: ..
      dockerfile: deploy/Dockerfile.go-server
    environment:
      AGENT_MEMORY_DATABASE_PATH: /data/agent-memory.db
    ports:
      - "8080:8080"
      - "9090:9090"
    volumes:
      - agent-memory-data:/data

  python-ai:
    build:
      context: ..
      dockerfile: deploy/Dockerfile.python-ai
    environment:
      AGENT_MEMORY_MODE: remote
      AGENT_MEMORY_GO_SERVER_URL: http://go-server:8080
      AGENT_MEMORY_GRPC_TARGET: go-server:9090
    depends_on:
      - go-server

volumes:
  agent-memory-data:
```

逐段来看：

1. `go-server` 服务会基于 `deploy/Dockerfile.go-server` 构建。
2. `AGENT_MEMORY_DATABASE_PATH=/data/agent-memory.db` 指定数据库文件写到卷挂载目录，不会随着容器删除而丢失。
3. 暴露 `8080` 和 `9090`，分别对应 HTTP 和 gRPC。
4. `agent-memory-data:/data` 是持久卷，里面会保存 SQLite 主文件，以及运行时可能产生的 `-wal` / `-shm` 文件。
5. `python-ai` 容器把 `AGENT_MEMORY_MODE` 设成 `remote`，说明它默认不会自己开本地 SQLite，而是把请求发给 Go 服务。
6. `AGENT_MEMORY_GO_SERVER_URL` 和 `AGENT_MEMORY_GRPC_TARGET` 都直接指向 Compose 网络里的服务名 `go-server`。
7. `depends_on` 只保证启动顺序，不代表 Go 服务一定已经健康可用，所以生产里仍建议加健康检查或重试。

## 两个 Dockerfile 的关键段落

### Go 服务镜像

文件：`deploy/Dockerfile.go-server:1`

```dockerfile
FROM golang:1.25 AS builder
WORKDIR /app
COPY go-server/go.mod go-server/go.sum* ./go-server/
RUN cd go-server && go mod download
COPY go-server ./go-server
COPY proto ./proto
RUN cd go-server && go build -o /out/agent-memory-server ./cmd/server

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /out/agent-memory-server /usr/local/bin/agent-memory-server
EXPOSE 8080 9090
ENTRYPOINT ["/usr/local/bin/agent-memory-server"]
```

这份 Dockerfile 的设计很标准：

1. 第一阶段用 `golang:1.25` 编译二进制。
2. 先复制 `go.mod` / `go.sum` 再 `go mod download`，能更好利用 Docker 缓存。
3. 第二阶段换成 `debian:bookworm-slim`，运行镜像更小、更干净。
4. 最终只带一个可执行文件，运行环境简单。

### Python 容器

文件：`deploy/Dockerfile.python-ai:1`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir .
EXPOSE 8000
CMD ["python", "-m", "agent_memory.interfaces.mcp_server"]
```

这份镜像的重点是：

1. 安装的是当前项目本身，而不是额外拷一堆脚本。
2. 默认入口是 `agent_memory.interfaces.mcp_server`，说明这个容器更像一个 Agent 能直接接入的工具服务。
3. 镜像没有自己定义 Go 地址，说明它依赖环境变量注入。

## 环境变量完整表

计划要求这里给出完整环境变量表，并说明适用范围。

### Go 侧

来源：`go-server/internal/config/config.go:20`

| 变量名 | 默认值 | 说明 | 适用范围 |
|---|---|---|---|
| `AGENT_MEMORY_HTTP_ADDRESS` | `:8080` | HTTP 监听地址 | Go |
| `AGENT_MEMORY_GRPC_ADDRESS` | `:9090` | gRPC 监听地址 | Go |
| `AGENT_MEMORY_DATABASE_PATH` | `agent-memory.db` | SQLite 路径 | Go |
| `AGENT_MEMORY_API_KEY` | 空 | API Key 校验值 | Go / Python |
| `AGENT_MEMORY_JWT_SECRET` | 空 | JWT 校验密钥 | Go |
| `AGENT_MEMORY_LOG_LEVEL` | `info` | 日志级别 | Go |
| `AGENT_MEMORY_SEMANTIC_LIMIT` | `10` | semantic 初始召回数 | Go / Python |
| `AGENT_MEMORY_LEXICAL_LIMIT` | `10` | full-text 初始召回数 | Go / Python |
| `AGENT_MEMORY_ENTITY_LIMIT` | `10` | entity 初始召回数 | Go / Python |
| `AGENT_MEMORY_DEFAULT_LIMIT` | `5` | 默认返回条数 | Go |
| `AGENT_MEMORY_RRF_K` | `60` | RRF 常数 | Go / Python |
| `AGENT_MEMORY_REQUEST_TIMEOUT_SECONDS` | `5.0` | 请求超时秒数 | Go / Python |

### Python 侧

来源：`src/agent_memory/config.py:25`

| 变量名 | 默认值 | 说明 | 适用范围 |
|---|---|---|---|
| `AGENT_MEMORY_DB_PATH` | `cwd/agent-memory.db` | 嵌入模式数据库路径 | Python |
| `AGENT_MEMORY_MODE` | `embedded` | `embedded` 或 `remote` | Python |
| `AGENT_MEMORY_GO_SERVER_URL` | `http://127.0.0.1:8080` | REST 基地址 | Python |
| `AGENT_MEMORY_GRPC_TARGET` | `127.0.0.1:9090` | gRPC 目标地址 | Python |
| `AGENT_MEMORY_PREFER_GRPC` | `true` | 是否优先走 gRPC | Python |
| `AGENT_MEMORY_API_KEY` | 空 | 远程调用携带的 API Key | Python / Go |
| `AGENT_MEMORY_JWT_TOKEN` | 空 | 远程调用携带的 JWT | Python |
| `AGENT_MEMORY_REQUEST_TIMEOUT_SECONDS` | `5.0` | HTTP 超时 | Python / Go |
| `AGENT_MEMORY_SEMANTIC_LIMIT` | `10` | semantic 限额 | Python / Go |
| `AGENT_MEMORY_LEXICAL_LIMIT` | `10` | lexical 限额 | Python / Go |
| `AGENT_MEMORY_ENTITY_LIMIT` | `10` | entity 限额 | Python / Go |
| `AGENT_MEMORY_DEFAULT_SEARCH_LIMIT` | `5` | SDK 默认返回数 | Python |
| `AGENT_MEMORY_RRF_K` | `60` | RRF 常数 | Python / Go |
| `AGENT_MEMORY_ENABLE_SQLITE_VEC` | `true` | 是否启用 `sqlite-vec` | Python |

### 一个容易忽略的小差异

Go 侧用的是 `AGENT_MEMORY_DATABASE_PATH`，Python 侧默认读取的是 `AGENT_MEMORY_DB_PATH`。  
这两个名字不完全一样，部署时要特别注意，别把 Go 的变量名误以为 Python 也能直接识别。

## 从零开始的端到端启动验证

计划要求这里给出完整操作序列。下面是一条最清楚的验收路径。

### 1. 拉代码并准备依赖

```bash
git clone <your-repo-url>
cd /Users/xjf/Public/Code/Agent-Project
python -m venv .venv
. .venv/bin/activate
pip install -e '.[dev,remote]'
```

### 2. 生成 proto

```bash
make proto
```

### 3. 启动 Go 服务

```bash
cd go-server
go run ./cmd/server
```

另开一个终端。

### 4. 健康检查

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/api/v1/info
curl http://127.0.0.1:8080/metrics
```

### 5. 写入一条记忆

```bash
curl -X POST http://127.0.0.1:8080/api/v1/memories \
  -H 'Content-Type: application/json' \
  -d '{
    "id":"deploy-demo-1",
    "content":"The user prefers SQLite for local-first agents.",
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
    "source_id":"deploy-demo",
    "causal_parent_id":"",
    "supersedes_id":"",
    "entity_refs":["sqlite","agent"],
    "tags":["demo"],
    "deleted_at":""
  }'
```

### 6. 做一次搜索验证

```bash
curl -X POST http://127.0.0.1:8080/api/v1/search/query \
  -H 'Content-Type: application/json' \
  -d '{"query":"What database does the user prefer?","embedding":[0.1,0.2,0.3],"entities":["sqlite"],"limit":5}'
```

### 7. 再用 Python 远程模式验证

```bash
PYTHONPATH=src .venv/bin/python - <<'PY'
from agent_memory import MemoryClient
from agent_memory.config import AgentMemoryConfig

client = MemoryClient(
    config=AgentMemoryConfig(
        mode="remote",
        go_server_url="http://127.0.0.1:8080",
        grpc_target="127.0.0.1:9090",
    )
)
print(client.search("What database does the user prefer?"))
PY
```

如果这七步都通了，说明协议层、存储层和 SDK 远程模式基本已经打通。

## Compose 启动命令

如果你希望一次起两套容器，可以直接运行：

```bash
docker compose -f deploy/docker-compose.yml up --build
```

然后验证：

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/api/v1/info
```

## 生产使用时要注意什么

### 数据文件与卷挂载

SQLite 不是“只有一个 `.db` 文件”那么简单。  
如果启用了 `WAL`，还会有配套的 `-wal` 和 `-shm` 文件，所以持久化时应保证整个目录一起保留。

### 认证

至少要考虑：

- `AGENT_MEMORY_API_KEY`
- `AGENT_MEMORY_JWT_SECRET`
- Python 远程客户端上的 `AGENT_MEMORY_JWT_TOKEN`

### 单节点边界

当前部署模型非常适合：

- 单节点
- 单用户或轻量团队
- 中小规模读写

若未来出现高并发写入、多租户隔离、跨节点同步等需求，就需要重新评估存储和部署拓扑。

## 小结

- 嵌入模式部署最简单，适合本地优先场景
- Compose 方案把 Go 服务和 Python MCP 容器拆成了两个服务
- `docker-compose.yml` 已经把数据库卷、端口和远程模式环境变量串起来了
- 部署时最重要的是分清 Go / Python 两侧环境变量、数据卷和认证配置

## 延伸阅读

- [04 Go 服务端指南](04-go-server-guide.md)
- [09 API 参考](09-api-reference.md)
- [11 性能与基准测试](11-performance-benchmarking.md)
