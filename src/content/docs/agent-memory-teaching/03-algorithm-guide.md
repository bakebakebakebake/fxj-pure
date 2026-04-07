---
title: '03 算法指南'
description: '用“直觉—公式—代码解读—计算示例”的统一结构，拆解系统里的核心算法，并把这些算法讲成面试中能展开 2-3 分钟的话题。'
order: 3
source: 'agent-memory'
sourceTitle: 'Agent Memory 文档'
section: 'teaching'
sectionTitle: '教学路径'
language: 'zh'
tags: ['docs', 'agent-memory', 'teaching']
---
## 前置知识

- [02 架构深度剖析](02-architecture-deep-dive.md)

## 本文目标

完成阅读后，你将理解：

1. 系统中的检索、治理与冲突算法分别解决什么问题
2. Go 与 Python 两端如何实现同一套策略
3. 为什么当前方案强调规则、排名和可解释性
4. 如何用具体数值手工推导结果

## 阅读提示

本文按四步法组织每个算法：

1. **直觉 (Intuition)**：先讲这个算法想解决什么问题
2. **公式 (Formula)**：再讲形式化定义
3. **代码解读 (Code Walkthrough)**：贴项目里的真实代码，并解释为什么这样写
4. **计算示例 (Worked Example)**：最后代入具体数字

如果是面试场景，建议优先熟悉四块内容：

- 遗忘曲线
- 意图路由
- RRF
- 冲突检测

这四块是被追问概率最高的部分。

---

## 1. 艾宾浩斯遗忘曲线

### 直觉 (Intuition)

记忆不会以固定速度衰减。重要、可信、被访问过的记忆应该保留更久，长时间未访问的弱记忆应该逐步下沉。这个模块的作用是给每条记忆算出一个“当前有效强度”，再根据阈值决定是否升到长期层或降回短期层。

这里最关键的设计点有两个：

1. 访问次数不能线性累加，否则经常访问的热点记忆会被无限放大
2. 长期层和短期层的衰减曲线不应该一样，否则“升到长期层”就没有意义

### 公式 (Formula)

$$
\text{strength} = importance \times trust \times (1 + \ln(1 + access)) \times e^{-decay \cdot age^\beta}
$$

符号说明：

- $importance$：重要度
- $trust$：信任分
- $access$：访问次数
- $decay$：衰减系数
- $age$：年龄，单位为天
- $\beta$：层级相关的时间曲线参数

层级切换逻辑可以单独写成：

$$
\text{NextLayer}(m)=
\begin{cases}
\text{long\_term}, & \text{strength} \ge 0.7 \\
\text{short\_term}, & \text{strength} \le 0.3 \\
\text{current layer}, & \text{otherwise}
\end{cases}
$$

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/controller/forgetting.go:25`

```go
func (policy ForgettingPolicy) EffectiveStrength(memory *memoryv1.MemoryItem, ageDays float64) float64 {
	accessBoost := 1 + math.Log(1+math.Max(float64(memory.AccessCount), 0))
	beta := policy.ShortTermBeta
	if memory.Layer == "long_term" {
		beta = policy.LongTermBeta
	}
	temporalDecay := math.Exp(-memory.DecayRate * math.Pow(ageDays, beta))
	return memory.Importance * memory.TrustScore * accessBoost * temporalDecay
}

func (policy ForgettingPolicy) NextLayer(memory *memoryv1.MemoryItem, ageDays float64) string {
	strength := policy.EffectiveStrength(memory, ageDays)
	if strength >= policy.PromoteThreshold {
		return "long_term"
	}
	if strength <= policy.DemoteThreshold {
		return "short_term"
	}
	return memory.Layer
}
```

代码位置：`src/agent_memory/controller/forgetting.py:14`

```python
def effective_strength(self, item: MemoryItem, age_days: float) -> float:
    access_boost = 1.0 + math.log1p(max(item.access_count, 0))
    beta = self.long_term_beta if item.layer == MemoryLayer.LONG_TERM else self.short_term_beta
    temporal_decay = math.exp(-item.decay_rate * (age_days ** beta))
    return item.importance * item.trust_score * access_boost * temporal_decay

def next_layer(self, item: MemoryItem, age_days: float) -> MemoryLayer:
    strength = self.effective_strength(item, age_days=age_days)
    if strength >= self.promote_threshold:
        return MemoryLayer.LONG_TERM
    if strength <= self.demote_threshold:
        return MemoryLayer.SHORT_TERM
    return item.layer
```

逐段解释：

1. `1 + math.Log(1 + ...)` 和 Python 的 `math.log1p(...)` 是同一件事，目标都是让访问加成增长变慢。  
   如果 `access_count = 0`，这一项会变成 `1 + ln(1) = 1`，不会把新记忆直接压成 0。

2. `math.Max(float64(memory.AccessCount), 0)` 的作用是防御异常数据。  
   正常情况下访问次数不应为负，但一旦出现坏数据，至少不会把 `log` 的输入变成负数。

3. `beta := policy.ShortTermBeta` 先假设记忆在短期层。  
   只有当 `memory.Layer == "long_term"` 时才切换为 `LongTermBeta`。这表示默认短期层衰减更陡。

4. `ShortTermBeta = 1.2`，`LongTermBeta = 0.8`。  
   物理含义可以理解为：短期层里，时间增长会被更强地放大；长期层里，时间惩罚更平缓。

5. `math.Exp(-memory.DecayRate * math.Pow(ageDays, beta))` 是时间衰减核。  
   `ageDays` 越大，指数项越小；`DecayRate` 越大，下降越快。

6. 返回值把四个因素直接相乘：`importance`、`trust`、`accessBoost`、`temporalDecay`。  
   这样设计的好处是任何一项很低，最终强度都会明显下降。

7. `NextLayer()` 没有再次重复公式，而是复用 `EffectiveStrength()`。  
   这让层迁移与强度计算永远保持同一口径。

8. `strength >= 0.7` 就升长期层，`strength <= 0.3` 就降回短期层。  
   中间 `0.3 ~ 0.7` 的缓冲区用来避免层级抖动。

#### 参数敏感性分析

下面用同一个 `decay=0.05` 比较不同 `beta`：

| `ageDays` | `beta=0.8` | `beta=1.0` | `beta=1.2` |
|-----------|-----------:|-----------:|-----------:|
| 1 | 0.9512 | 0.9512 | 0.9512 |
| 7 | 0.7717 | 0.7047 | 0.6075 |
| 30 | 0.4368 | 0.2231 | 0.0786 |
| 60 | 0.2791 | 0.0498 | 0.0046 |

这张表说明：

1. 在小年龄区间，三条曲线差别不大
2. 时间一长，`beta=1.2` 会明显更陡
3. 所以 `long_term=0.8`、`short_term=1.2` 这组参数确实体现了“短期更容易掉，长期更稳定”

#### 设计取舍

1. **为什么用双阈值，不用单阈值**  
   单阈值会造成抖动。例如某条记忆今天算出来 `0.69`，明天触发一次访问变成 `0.71`，后天又掉回 `0.68`。双阈值把状态切换分成“明确升层”和“明确降层”，稳定得多。

2. **为什么按层级区分 beta**  
   如果长短期层都用同一个 beta，那么“长期层”就只是名字不同。当前设计把长期层的时间惩罚变缓，才让升层具备实际价值。

3. **为什么访问加成用对数，不用线性项**  
   如果用 `1 + access_count`，访问 100 次的记忆会把其它因素完全淹没。对数项既保留“访问越多越重要”，又控制了增长速度。

### 计算示例 (Worked Example)

假设：

- `importance = 0.8`
- `trust = 0.9`
- `access = 4`
- `decay = 0.05`
- `age = 10`
- `beta = 1.2`

则：

$$
1 + \ln(1 + 4) = 1 + \ln 5 \approx 2.609
$$

$$
10^{1.2} \approx 15.85
$$

$$
e^{-0.05 \cdot 15.85} \approx e^{-0.7925} \approx 0.453
$$

$$
strength \approx 0.8 \times 0.9 \times 2.609 \times 0.453 \approx 0.851
$$

因为 `0.851 > 0.7`，所以 `NextLayer()` 会返回 `long_term`。

---

## 2. 多路检索与倒数排名融合 (Reciprocal Rank Fusion, RRF)

### 直觉 (Intuition)

语义检索、全文检索和实体检索的分数尺度不同。直接做加权平均很难调。RRF 只看排名位置，把多个“谁排在前面”的信息合到一起，更稳，也更容易解释。

这个算法的工程价值不在“数学多先进”，而在“跨路结果不需要做复杂校准”。对一个同时有 semantic、full-text、entity 三条召回通路的系统来说，这个特性非常重要。

### 公式 (Formula)

$$
\text{score}(d) = \sum_i \frac{1}{k + rank_i(d)}
$$

符号说明：

- $d$：候选记忆
- $i$：第 $i$ 路检索
- $rank_i(d)$：候选在该路结果中的名次，从 1 开始
- $k$：平滑常数，本项目使用 `60`

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/controller/router.go:69`

```go
func ReciprocalRankFusion(rankings map[string][]string, k int) map[string]float64 {
	scores := map[string]float64{}
	for _, rankedIDs := range rankings {
		for rank, itemID := range rankedIDs {
			scores[itemID] += 1.0 / float64(k+rank+1)
		}
	}
	ordered := make([]struct {
		ID    string
		Score float64
	}, 0, len(scores))
	for id, score := range scores {
		ordered = append(ordered, struct {
			ID    string
			Score float64
		}{ID: id, Score: score})
	}
	sort.Slice(ordered, func(i, j int) bool { return ordered[i].Score > ordered[j].Score })
	output := make(map[string]float64, len(ordered))
	for _, item := range ordered {
		output[item.ID] = item.Score
	}
	return output
}
```

代码位置：`src/agent_memory/controller/router.py:72`

```python
def reciprocal_rank_fusion(rankings: dict[str, list[str]], k: int = 60) -> dict[str, float]:
    scores: dict[str, float] = defaultdict(float)
    for ranked_ids in rankings.values():
        for rank, item_id in enumerate(ranked_ids, start=1):
            scores[item_id] += 1.0 / (k + rank)
    return dict(sorted(scores.items(), key=lambda item: item[1], reverse=True))
```

逐段解释：

1. Go 里 `rank` 从 0 开始，所以公式写成 `k + rank + 1`。  
   这是把代码里的 0-based 索引对齐到论文里的 1-based 排名。

2. Python 里直接 `enumerate(..., start=1)`，所以不需要额外 `+1`。  
   这是一种更贴近公式的写法。

3. Go 版本先累计到 `scores`，再构造 `ordered` 做显式排序。  
   这样做的原因是 Go 的 map 无序，若不排序，输出顺序不稳定。

4. Python 版本直接 `sorted(scores.items(), ...)`。  
   这一步除了得到降序结果，也让测试更稳定。

#### 为什么 RRF 优于加权平均

假设 semantic 检索的分数范围是 `0.90 ~ 0.70`，全文检索的分数范围是 `15.0 ~ 8.0`。如果直接加权平均，即使全文检索只是弱相关，它的大数值也可能“劫持”最终结果。

反例：

| 候选 | semantic 分数 | full-text 分数 | 简单平均 |
|------|---------------|----------------|---------:|
| A | 0.92 | 8.0 | 4.46 |
| B | 0.78 | 15.0 | 7.89 |

这个例子里，`B` 可能只是在全文里词频更高，但语义更差。简单平均仍会把它推到前面。

RRF 改看排名：

| 路径 | 第 1 名 | 第 2 名 |
|------|---------|---------|
| semantic | A | B |
| full-text | B | A |

于是：

$$
score(A)=\frac{1}{61}+\frac{1}{62}
$$

$$
score(B)=\frac{1}{61}+\frac{1}{62}
$$

如果两路意见完全对立，RRF 会认为两者同级，而不是让某一路分数尺度更大的结果直接统治最终排序。

#### `k` 值的影响

同一组排名下比较不同 `k`：

| 候选 | 排名组合 | `k=1` | `k=60` | `k=1000` |
|------|----------|------:|--------:|----------:|
| A | 1, 2 | 0.8333 | 0.03252 | 0.001997 |
| B | 2, 1 | 0.8333 | 0.03252 | 0.001997 |
| C | 1, -, - | 0.5000 | 0.01639 | 0.000999 |

解释：

1. `k=1` 时，头部差异被放得很大
2. `k=1000` 时，所有分数都被压得很小，区分度下降
3. `k=60` 是实践里常见的平衡点，既保留排序差异，又不会让头部差距过于激进

### 计算示例 (Worked Example)

设三路结果分别为：

- semantic：`A, B`
- full_text：`B, A`
- entity：`B`

则：

$$
score(A) = \frac{1}{61} + \frac{1}{62} \approx 0.03252
$$

$$
score(B) = \frac{1}{62} + \frac{1}{61} + \frac{1}{61} \approx 0.04891
$$

所以 `B` 会排在前面。  
面试里可以顺手补一句：`B` 虽然未必在某一路最强，但它在更多通路里稳定靠前，所以融合后获胜。

---

## 3. 意图感知路由

### 直觉 (Intuition)

不同问题需要不同检索策略。“为什么”更像因果问题，“最近”更像时间问题，“如何”更像过程问题。先识别意图，再决定用哪些检索路径，能减少无效召回。

当前路由策略的工程目标不是覆盖所有自然语言变化，而是用**低延迟、可测、可解释**的方式覆盖最常见的 Agent 记忆查询。

### 公式 (Formula)

这里没有连续数值公式，更适合理解为一个策略矩阵：

$$
\text{intent} = f(\text{query keywords})
$$

$$
\text{plan} = g(\text{intent}) = \{\text{strategies}, \text{filters}\}
$$

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/controller/router.go:26`

```go
var intentPatterns = []struct {
	Intent   Intent
	Patterns []string
}{
	{IntentCausal, []string{"为什么", "为何", "导致", "cause", "caused", "why"}},
	{IntentTemporal, []string{"上周", "最近", "之前", "刚才", "when", "recent", "before"}},
	{IntentProcedural, []string{"如何", "怎么", "步骤", "how to", "how do", "step"}},
	{IntentExploratory, []string{"关于", "all about", "everything about", "related to"}},
	{IntentFactual, []string{"什么是", "谁是", "what is", "who is", "which"}},
}
```

代码位置：`src/agent_memory/controller/router.py:15`

```python
INTENT_PATTERNS = {
    QueryIntent.CAUSAL: ["为什么", "为何", "导致", "cause", "caused", "why"],
    QueryIntent.TEMPORAL: ["上周", "最近", "之前", "刚才", "when", "recent", "before"],
    QueryIntent.PROCEDURAL: ["如何", "怎么", "步骤", "how to", "how do", "step"],
    QueryIntent.EXPLORATORY: ["关于", "all about", "everything about", "related to"],
    QueryIntent.FACTUAL: ["什么是", "谁是", "what is", "who is", "which"],
}
```

代码位置：`go-server/internal/controller/router.go:51`

```go
func (router Router) Plan(query string) RetrievalPlan {
	intent := router.Classify(query)
	switch intent {
	case IntentFactual:
		return RetrievalPlan{Intent: intent, Strategies: []string{"semantic", "entity", "full_text"}, Filters: map[string]string{}}
	case IntentTemporal:
		return RetrievalPlan{Intent: intent, Strategies: []string{"semantic", "full_text"}, Filters: map[string]string{"sort": "recency"}}
	case IntentCausal:
		return RetrievalPlan{Intent: intent, Strategies: []string{"semantic", "full_text", "causal_trace"}, Filters: map[string]string{}}
	case IntentExploratory:
		return RetrievalPlan{Intent: intent, Strategies: []string{"entity", "semantic", "full_text"}, Filters: map[string]string{}}
	case IntentProcedural:
		return RetrievalPlan{Intent: intent, Strategies: []string{"semantic", "full_text"}, Filters: map[string]string{"memory_type": "procedural"}}
	default:
		return RetrievalPlan{Intent: intent, Strategies: []string{"semantic", "full_text"}, Filters: map[string]string{}}
	}
}
```

代码位置：`go-server/internal/controller/router.go:94`

```go
var intentMarkerPattern = regexp.MustCompile(`(?i)(为什么|为何|导致|what is|who is|how to|how do|all about|everything about)`)

func StripIntentMarkers(query string) string {
	return strings.TrimSpace(intentMarkerPattern.ReplaceAllString(query, " "))
}
```

逐段解释：

1. `intentPatterns` 的顺序有意义。  
   分类器是顺序扫描，一旦命中就返回，因此更强语义的模式应该放前面。

2. `Plan()` 输出的不只是意图，还有 `Strategies` 和 `Filters`。  
   这样后续编排器不需要再重新理解意图，只要按计划执行。

3. `Temporal` 不是切换特殊算法，而是给结果加一个 `sort=recency` 过滤。  
   这说明当前系统把“时间问题”主要看成“语义召回 + 最近优先排序”。

4. `Procedural` 的过滤条件是 `memory_type=procedural`。  
   这是一种很工程化的做法：过程性知识优先在数据建模阶段区分，而不是只靠检索时临时猜。

5. `StripIntentMarkers()` 会把“为什么”“what is”“how to”这类词先剥掉。  
   如果不剥，全文检索会把这些高频问题词也当成匹配词，降低真正内容词的权重。

#### 完整策略矩阵

| 意图 | 关键词示例 | 检索策略 | 排序/过滤 |
|------|------------|----------|-----------|
| `factual` | 什么是、谁是、what is | semantic + entity + full_text | 默认 |
| `temporal` | 最近、之前、when | semantic + full_text | `sort=recency` |
| `causal` | 为什么、导致、why | semantic + full_text + causal_trace | 默认 |
| `exploratory` | 关于、all about | entity + semantic + full_text | 默认 |
| `procedural` | 如何、怎么、how to | semantic + full_text | `memory_type=procedural` |
| `general` | 无明显关键词 | semantic + full_text | 默认 |

#### 回退逻辑

如果一个问题没有命中任何关键词，系统会回到 `GENERAL`，执行 `semantic + full_text`。  
原因很简单：这两条通路一个负责语义近邻，一个负责词面召回，组合起来最稳，不容易出现完全空结果。

### 计算示例 (Worked Example)

查询：`为什么选择 SQLite`

步骤：

1. `Classify()` 扫描到关键词“为什么”
2. 返回 `IntentCausal`
3. `Plan()` 生成三路策略：`semantic`、`full_text`、`causal_trace`
4. `StripIntentMarkers()` 把“为什么”剥掉后，全文检索只保留 `选择 SQLite`
5. 如果 semantic 没结果，则 causal trace 改用 full-text 的头部结果做种子

---

## 4. 信任评分

### 直觉 (Intuition)

记忆的可信度不能只看来源。新近程度、旁证数量和冲突数量都会影响最终分数。这个模块的目标是给系统一个简单、可测、可裁剪的可信度函数。

当前设计其实是在回答一个很实用的问题：  
“当系统要在两条相似记忆里判断谁更值得信时，最稳定的规则是什么？”

### 公式 (Formula)

$$
\text{score} = source \times 0.5 + recency \times 0.15 + corroboration \times 0.15 - contradiction \times 0.2
$$

其中：

- $source$：来源可靠度
- $recency$：时间新鲜度，按 90 天线性衰减
- $corroboration$：旁证归一化结果
- $contradiction$：冲突归一化结果

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/controller/trust.go:19`

```go
func (scorer TrustScorer) Score(sourceReliability float64, corroborationCount int, contradictionCount int, ageDays float64) float64 {
	recencyBonus := 1.0 - min(ageDays, 90.0)/90.0
	if recencyBonus < 0 {
		recencyBonus = 0
	}
	corroborationBonus := min(float64(corroborationCount), 5) / 5.0
	contradictionPenalty := min(float64(contradictionCount), 5) / 5.0
	rawScore := sourceReliability*scorer.SourceWeight +
		recencyBonus*scorer.RecencyWeight +
		corroborationBonus*scorer.CorroborationWeight -
		contradictionPenalty*scorer.ContradictionWeight
	if rawScore < 0 {
		return 0
	}
	if rawScore > 1 {
		return 1
	}
	return rawScore
}
```

代码位置：`src/agent_memory/controller/trust.py:13`

```python
def score(self, source_reliability: float, corroboration_count: int = 0, contradiction_count: int = 0, age_days: float = 0.0) -> float:
    recency_bonus = 1.0 - min(age_days, 90.0) / 90.0
    recency_bonus = max(recency_bonus, 0.0)
    corroboration_bonus = min(float(corroboration_count), 5.0) / 5.0
    contradiction_penalty = min(float(contradiction_count), 5.0) / 5.0
    score = (
        source_reliability * self.source_weight
        + recency_bonus * self.recency_weight
        + corroboration_bonus * self.corroboration_weight
        - contradiction_penalty * self.contradiction_weight
    )
    return max(0.0, min(1.0, score))
```

逐段解释：

1. `source` 占 `50%`。  
   这是因为来源可靠度通常在写入时就已经是最强的先验信号。比如“用户明确说过的话”与“模型推断出的倾向”天然不能等权。

2. `recency` 和 `corroboration` 都是 `15%`。  
   它们重要，但不应盖过来源本身。

3. `contradiction` 给 `20%` 的负权重。  
   系统认为冲突比旁证更有破坏性，因此惩罚略高于旁证奖励。

4. `min(ageDays, 90.0)/90.0` 表示 recency 只看最近 90 天。  
   超过 90 天后，这一项直接归零，不再继续恶化。

5. `min(corroborationCount, 5) / 5.0` 表示旁证条数封顶为 5。  
   这是为了避免大量近似重复的支持证据把分数堆到不合理的高度。

6. 最后的 clamp 到 `[0, 1]` 很关键。  
   因为冲突很多时，`rawScore` 可能变成负数；来源很强、旁证很多时，也可能超过 1。

#### 三个典型场景

| 场景 | source | age_days | corroboration | contradiction | 最终特征 |
|------|-------:|---------:|--------------:|--------------:|----------|
| 高信任新记忆 | 0.9 | 2 | 2 | 0 | 分数高，接近 0.7+ |
| 老旧无旁证记忆 | 0.7 | 120 | 0 | 0 | 主要靠来源项撑住 |
| 新记忆但高冲突 | 0.8 | 1 | 0 | 4 | recency 很高，但冲突会强力拉低 |

### 计算示例 (Worked Example)

若：

- `source = 0.8`
- `age_days = 15`
- `corroboration = 2`
- `contradiction = 1`

则：

$$
recency = 1 - 15/90 = 0.8333
$$

$$
corroboration = 2/5 = 0.4,\ contradiction = 1/5 = 0.2
$$

$$
score = 0.8 \times 0.5 + 0.8333 \times 0.15 + 0.4 \times 0.15 - 0.2 \times 0.2 \approx 0.545
$$

如果再加入 3 条冲突，`contradiction = 4/5 = 0.8`，分数会明显下降到：

$$
0.8 \times 0.5 + 0.8333 \times 0.15 + 0.4 \times 0.15 - 0.8 \times 0.2 \approx 0.425
$$

---

## 5. 冲突检测

### 直觉 (Intuition)

两条记忆内容很像，但极性相反时，很可能构成矛盾。“用户喜欢 SQLite”和“用户不喜欢 SQLite”需要被标成 `contradicts`，这样检索和治理模块才能继续处理。

系统并没有把“冲突检测”做成一个重型分类器，而是采用了一个非常务实的流程：

1. 先用向量召回语义近邻
2. 再用启发式公式判断是否矛盾
3. 只有在相似度够高时，才可选地交给 LLM 复判

### 公式 (Formula)

$$
\text{confidence} = similarity \times 0.45 + ratio \times 0.25 + polarity\_bonus + preference\_bonus
$$

其中：

- $similarity$：外部或内部向量相似度
- $ratio$：词面重合比例
- $polarity\_bonus$：正负极性不同的加分
- $preference\_bonus$：包含偏好类表达的加分

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/controller/conflict.go:9`

```go
var negationMarkers = []string{"不", "没", "不是", "不会", "never", "not", "no "}
var preferenceMarkers = []string{"喜欢", "偏好", "prefer", "prefers", "using", "uses", "选择", "selected"}
var normalizePattern = regexp.MustCompile(`[\p{Han}\w]+`)

func ContradictionConfidence(left string, right string, similarity float64) float64 {
	leftNorm := normalize(left)
	rightNorm := normalize(right)
	ratio := similarityRatio(leftNorm, rightNorm)
	leftNegative := containsAny(leftNorm, negationMarkers)
	rightNegative := containsAny(rightNorm, negationMarkers)
	polarityBonus := 0.0
	if leftNegative != rightNegative {
		polarityBonus = 0.25
	}
	preferenceBonus := 0.0
	if containsAny(leftNorm, preferenceMarkers) || containsAny(rightNorm, preferenceMarkers) {
		preferenceBonus = 0.15
	}
	value := similarity*0.45 + ratio*0.25 + polarityBonus + preferenceBonus
	if value > 1 {
		return 1
	}
	return value
}
```

代码位置：`src/agent_memory/controller/conflict.py:33`

```python
def detect(self, candidate: MemoryItem, limit: int = 10) -> list[ConflictRecord]:
    vector_hits = self.backend.search_by_vector(candidate.embedding, limit=limit)
    conflicts: list[ConflictRecord] = []
    for existing, similarity in vector_hits:
        if existing.id == candidate.id:
            continue
        if self.backend.relation_exists_between(
            candidate.id,
            existing.id,
            relation_types=["contradicts", "supersedes"],
        ):
            continue
        label, confidence, reason = self._judge_relationship(candidate, existing, similarity)
        if label not in {"contradicts", "supersedes"} or confidence < 0.55:
            continue
        conflicts.append(
            ConflictRecord(
                existing_id=existing.id,
                candidate_id=candidate.id,
                confidence=confidence,
                resolution=ConflictResolution.SUPERSEDE if label == "supersedes" else ConflictResolution.KEEP_BOTH,
                reason=reason,
            )
        )
```

代码位置：`src/agent_memory/controller/conflict.py:60`

```python
def _judge_relationship(self, candidate: MemoryItem, existing: MemoryItem, similarity: float) -> tuple[str, float, str]:
    heuristic_confidence = self._contradiction_confidence(candidate.content, existing.content, similarity)
    heuristic_label = "contradicts" if heuristic_confidence >= 0.55 else "none"
    heuristic_reason = "Heuristic semantic overlap and polarity mismatch."
    if self.llm_client is None or similarity < 0.4:
        return heuristic_label, heuristic_confidence, heuristic_reason
    try:
        response = self.llm_client.generate_json(
            prompt=(
                f"Memory A: {existing.content}\n"
                f"Memory B: {candidate.content}\n"
                "Decide the relationship."
            ),
            schema=CONFLICT_SCHEMA,
            schema_name="memory_conflict_judgement",
            system_prompt=CONFLICT_JUDGE_PROMPT,
        )
```

逐段解释：

1. 极性标记完整列表是：  
   `不 / 没 / 不是 / 不会 / never / not / no`。  
   它们是最直接的“语义方向翻转”信号。

2. 偏好标记完整列表是：  
   `喜欢 / 偏好 / prefer / prefers / using / uses / 选择 / selected`。  
   这些词用来强调“这段文本在表达立场”。

3. `normalize()` 会先 `lower()`，再用正则提取中英文 token。  
   这样做能把多余标点去掉，让后续词面重合比较更稳定。

4. Go 里的 `similarityRatio()` 是基于 token 集合交集和较长长度做比例。  
   Python 里则用 `SequenceMatcher` 做字符串层面的比例比较。两者实现不同，但目标一致：给“词面相似”一个补充信号。

5. `_judge_relationship()` 的 LLM 裁判只有在两个条件同时满足时才会启用：  
   - 配置了 `llm_client`  
   - `similarity >= 0.4`

6. 这说明 LLM 不是默认路径，只是高相似候选上的可选复判器。  
   这样既控制成本，也避免把低相似文本交给 LLM 硬判。

7. 最终只有 `label in {"contradicts", "supersedes"}` 且 `confidence >= 0.55` 才进入冲突记录。  
   `0.55` 既是过滤门槛，也是后续建边的依据。

#### 从检测到建边的完整链路

完整链路发生在 Python `add()` 之后：

1. `detect_conflicts(item)` 调用 `ConflictDetector.detect()`
2. 对 top semantic hits 逐个判定
3. 若 `confidence >= 0.55`，生成 `ConflictRecord`
4. `_apply_conflicts()` 根据 record 建 `contradicts` 或 `supersedes` 关系
5. 冲突存在时，后续 health 和 trace 就能看到这条边

### 计算示例 (Worked Example)

假设：

- 向量相似度 `0.82`
- token overlap ratio `0.60`
- 极性相反
- 两边都包含“喜欢 / prefer”

则：

$$
confidence = 0.82 \times 0.45 + 0.60 \times 0.25 + 0.25 + 0.15 = 0.919
$$

这已经远高于 `0.55` 的阈值，因此会进入冲突候选。

---

## 6. 记忆合并

### 直觉 (Intuition)

系统长期运行后，容易出现内容相近、时间接近、实体一致的重复记忆。合并模块不直接替换原始记忆，而是先给出 merge plan，降低误伤。

这部分逻辑更偏“治理”而不是“检索”，但面试时很容易被问到，因为它体现了系统如何避免越用越乱。

### 公式 (Formula)

这里更像一个过滤条件组合：

$$
\text{merge candidate} = \text{same entity group} \land \text{cosine} \ge 0.9 \land \text{within 45 days}
$$

### 代码解读 (Code Walkthrough)

代码位置：`src/agent_memory/controller/consolidation.py:17`

```python
def find_merge_groups(self, memories: list[MemoryItem]) -> list[list[MemoryItem]]:
    by_entity: dict[str, list[MemoryItem]] = defaultdict(list)
    for memory in memories:
        for entity in memory.entity_refs:
            by_entity[entity.lower()].append(memory)

    groups: list[list[MemoryItem]] = []
    seen_ids: set[str] = set()
    for candidates in by_entity.values():
        for left, right in combinations(candidates, 2):
            if left.id in seen_ids or right.id in seen_ids:
                continue
            if abs((left.created_at - right.created_at).days) > self.time_window_days:
                continue
            similarity = self._cosine_similarity(left.embedding, right.embedding)
            if similarity < self.similarity_threshold:
                continue
            groups.append([left, right])
            seen_ids.update({left.id, right.id})
    return groups
```

代码位置：`src/agent_memory/controller/consolidation.py:108`

```python
def _create_merged_draft_heuristic(self, memories: list[MemoryItem], *, source_id: str) -> MemoryDraft:
    ordered = sorted(
        memories,
        key=lambda item: (item.importance, item.trust_score, item.created_at),
        reverse=True,
    )
    anchor = ordered[0]
    return MemoryDraft(
        content=anchor.content,
        memory_type=anchor.memory_type,
        importance=max(memory.importance for memory in memories),
        trust_score=max(memory.trust_score for memory in memories),
        source_id=source_id,
        entity_refs=sorted({entity for memory in memories for entity in memory.entity_refs}),
        tags=sorted({tag for memory in memories for tag in memory.tags} | {"consolidated"}),
    )
```

逐段解释：

1. 合并不是对全量记忆做 `O(n^2)` 两两比较，而是先按 `entity_refs` 分桶。  
   这一步直接把候选空间压缩到“同一实体相关”的小组内。

2. `time_window_days = 45` 用来约束时间距离。  
   两条内容相近但相隔半年以上的记忆，不一定应该被合并。

3. 启发式版本下，新草稿会保留：  
   - `max(importance)`  
   - `max(trust_score)`  
   - 所有实体并集  
   - 所有标签并集  
   - 额外加上 `consolidated`

4. 真正落库时，`client.consolidate()` 会把新记忆的 `supersedes_id` 指向主 anchor。  
   这就形成了一条明确的覆盖链。

5. 如果配置了 LLM，`create_merged_draft()` 会优先让 LLM 生成摘要内容。  
   否则退回启发式版本，直接选择排序最高的那条内容作为锚点文本。

### 计算示例 (Worked Example)

若两条记忆：

- 实体都包含 `sqlite`
- 余弦相似度 `0.93`
- 时间差 `12` 天

则它们会进入同一个候选组。  
若其中一条 `importance=0.8`、另一条 `importance=0.6`，合并草稿的 `importance` 会取 `0.8`，标签会并集去重，再额外加上 `consolidated`。

---

## 7. 余弦相似度

### 直觉 (Intuition)

向量检索最基本的问题是判断两段文本是否“方向接近”。余弦相似度衡量的正是这个方向夹角。

在这个项目里，它被用于两处：

- semantic 检索打分
- consolidation 和 conflict 的相似度参考

### 公式 (Formula)

$$
\cos(\theta) = \frac{\vec{a} \cdot \vec{b}}{\|\vec{a}\| \cdot \|\vec{b}\|}
$$

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/storage/sqlite.go:552`

```go
func cosineSimilarity(left []float32, right []float32) float64 {
	if len(left) == 0 || len(right) == 0 {
		return 0
	}
	size := len(left)
	if len(right) < size {
		size = len(right)
	}
	var numerator float64
	var leftNorm float64
	var rightNorm float64
	for index := range size {
		numerator += float64(left[index] * right[index])
		leftNorm += float64(left[index] * left[index])
		rightNorm += float64(right[index] * right[index])
	}
	if leftNorm == 0 || rightNorm == 0 {
		return 0
	}
	return numerator / (math.Sqrt(leftNorm) * math.Sqrt(rightNorm))
}
```

代码位置：`src/agent_memory/storage/sqlite_backend.py:27`

```python
def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    size = min(len(left), len(right))
    left_trimmed = left[:size]
    right_trimmed = right[:size]
    numerator = sum(a * b for a, b in zip(left_trimmed, right_trimmed, strict=False))
    left_norm = sqrt(sum(a * a for a in left_trimmed))
    right_norm = sqrt(sum(b * b for b in right_trimmed))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return numerator / (left_norm * right_norm)
```

逐段解释：

1. Go 版本把点积和两个范数放在一个循环里计算。  
   这样只遍历一次向量，比分三次遍历更省。

2. `size := len(left); if len(right) < size { size = len(right) }` 的作用是处理维度不匹配。  
   项目默认不会出现这种情况，但这个防御性写法让代码更稳。

3. `if leftNorm == 0 || rightNorm == 0 { return 0 }` 是零向量保护。  
   否则会出现除以零。

4. Python 版本用切片和 `zip`，表达更直白。  
   Go 版本则更强调循环内的累计。

#### sqlite-vec vs 纯扫描

Python 端优先尝试 `sqlite-vec`，如果扩展不可用，再退回 `_cosine_similarity`。  
Go 端当前只有纯扫描版本，所以在数据量更大时，这一段会成为未来的优化重点。

### 计算示例 (Worked Example)

向量：

- `a = [1, 2, 3]`
- `b = [1, 2, 4]`

则：

$$
a \cdot b = 1 + 4 + 12 = 17
$$

$$
\|a\| = \sqrt{14}, \|b\| = \sqrt{21}
$$

$$
\cos(\theta) = \frac{17}{\sqrt{14}\sqrt{21}} \approx 0.991
$$

这说明两条文本在向量空间里非常接近。

---

## 8. FTS5 全文检索

### 直觉 (Intuition)

向量检索擅长语义邻近，但对关键字精确命中、代码标识符和中英混合短语，全文检索更直接。

当前项目刻意保留了两条全文路径：

- Python 端：`FTS5 + bm25`
- Go 端：`LIKE + lexicalScore`

这正好能作为一个很好的工程取舍案例。

### 公式 (Formula)

BM25 的核心思想可以简单理解为：

$$
\text{score} \propto \text{term frequency} \times \text{inverse document frequency} \times \text{length normalization}
$$

意思是：词出现得多、又足够有区分度、同时文档长度不过分长时，分数更高。

### 代码解读 (Code Walkthrough)

代码位置：`src/agent_memory/storage/sqlite_backend.py:45`

```python
def _build_fts_query(query: str) -> str:
    terms = re.findall(r"[\w\u4e00-\u9fff-]+", query.lower())
    if not terms:
        return ""
    return " OR ".join(f'"{term}"' for term in terms)
```

代码位置：`src/agent_memory/storage/sqlite_backend.py:199`

```python
rows = self.connection.execute(
    f"""
    SELECT m.*, v.embedding_json, bm25(memories_fts) AS rank_score
    FROM memories_fts
    JOIN memories m ON m.rowid = memories_fts.rowid
    LEFT JOIN memory_vectors v ON v.memory_id = m.id
    WHERE memories_fts MATCH ?
      AND m.deleted_at IS NULL
      {memory_type_clause}
    ORDER BY rank_score
    LIMIT ?
    """,
    params,
).fetchall()
```

代码位置：`src/agent_memory/storage/schema.sql:92`

```sql
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(rowid, content, tags)
    VALUES (
        new.rowid,
        new.content,
        trim(replace(replace(replace(replace(new.tags_json, '[', ' '), ']', ' '), '\"', ' '), ',', ' '))
    );
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
    INSERT INTO memories_fts(memories_fts, rowid, content, tags)
    VALUES (
        'delete',
        old.rowid,
        old.content,
        trim(replace(replace(replace(replace(old.tags_json, '[', ' '), ']', ' '), '\"', ' '), ',', ' '))
    );
END;
```

代码位置：`go-server/internal/storage/sqlite.go:574`

```go
func lexicalScore(query string, content string, tags []string) float64 {
	queryTerms := ftsQueryPattern.FindAllString(strings.ToLower(query), -1)
	if len(queryTerms) == 0 {
		return 0
	}
	text := strings.ToLower(content + " " + strings.Join(tags, " "))
	matches := 0
	for _, term := range queryTerms {
		if strings.Contains(text, term) {
			matches++
		}
	}
	return float64(matches) / float64(len(queryTerms))
}
```

逐段解释：

1. `_build_fts_query()` 会把中英词项都提出来，再用 `OR` 拼接。  
   它没有做重型中文分词，而是使用正则提取 token，足够覆盖当前项目里的短查询。

2. Python 端使用 `bm25(memories_fts)` 排序。  
   这意味着 SQLite 直接帮我们做了全文索引和相关性排序。

3. 三个触发器 `INSERT / DELETE / UPDATE` 负责让 `memories_fts` 与主表保持同步。  
   这是 Python 端全文查询能长期稳定工作的关键。

4. Go 端当前没有直接使用 FTS5 虚拟表，而是退回 `LIKE` + `lexicalScore()`。  
   原因是 Go 服务端当前更强调简单稳定，避免在服务部署时引入更多 SQLite 扩展编译细节。

### 计算示例 (Worked Example)

查询：`SQLite agent`

若内容中两个词都出现，则：

$$
lexicalScore = 2 / 2 = 1.0
$$

若只出现一个词，则：

$$
lexicalScore = 1 / 2 = 0.5
$$

这虽然比 BM25 粗糙，但作为 Go 端的轻量回退路径是够用的。

---

## 9. 检索编排全流程

### 直觉 (Intuition)

单路检索很少能覆盖所有问题。编排器的责任是把多路结果组织起来，保持召回质量与可解释性。

它不是“又一个算法”，而是把前面几个算法真正串成产品行为的那一层。

### 公式 (Formula)

可以把编排器抽象成：

$$
\text{output} = \text{Touch}(\text{GetMemory}(\text{TakeTopK}(\text{RRF}(\text{Collect}(\text{Plan}(query))))))
$$

### 代码解读 (Code Walkthrough)

代码位置：`go-server/internal/search/orchestrator.go:38`

```go
func (orchestrator *Orchestrator) Search(ctx context.Context, query string, embedding []float32, entities []string, limit int32) ([]*memoryv1.SearchResult, error) {
	if limit == 0 {
		limit = orchestrator.config.DefaultLimit
	}
	plan := orchestrator.router.Plan(query)
	rankings := map[string][]string{}
	resultsByID := map[string]*memoryv1.MemoryItem{}
	matchedBy := map[string]map[string]bool{}
	memoryType := plan.Filters["memory_type"]
	normalizedQuery := controller.StripIntentMarkers(query)
	if normalizedQuery == "" {
		normalizedQuery = query
	}

	for _, strategy := range plan.Strategies {
		switch strategy {
		case "semantic":
			results, err := orchestrator.backend.SearchByVector(ctx, embedding, orchestrator.config.SemanticLimit, memoryType)
			if err != nil {
				return nil, err
			}
			collectResults("semantic", results, rankings, resultsByID, matchedBy)
		case "full_text":
			results, err := orchestrator.backend.SearchFullText(ctx, normalizedQuery, orchestrator.config.LexicalLimit, memoryType)
			if err != nil {
				return nil, err
			}
			collectResults("full_text", results, rankings, resultsByID, matchedBy)
		case "entity":
			results, err := orchestrator.backend.SearchByEntities(ctx, entities, orchestrator.config.EntityLimit, memoryType)
			if err != nil {
				return nil, err
			}
			collectResults("entity", results, rankings, resultsByID, matchedBy)
		case "causal_trace":
			seedIDs := rankings["semantic"]
			if len(seedIDs) == 0 {
				seedIDs = rankings["full_text"]
			}
			traceIDs := []string{}
			for _, seedID := range take(seedIDs, 2) {
				ancestors, err := orchestrator.backend.TraceAncestors(ctx, seedID, 5)
				if err != nil {
					return nil, err
				}
				for _, item := range ancestors {
					resultsByID[item.Id] = item
					ensureMatch(item.Id, matchedBy)["causal_trace"] = true
					traceIDs = append(traceIDs, item.Id)
				}
			}
			if len(traceIDs) > 0 {
				rankings["causal_trace"] = traceIDs
			}
		}
	}

	fused := controller.ReciprocalRankFusion(rankings, orchestrator.config.RRFK)
```

代码位置：`src/agent_memory/client.py:121`

```python
def search(self, query: str, limit: int | None = None) -> list[SearchResult]:
    search_limit = limit or self.config.default_search_limit
    if isinstance(self.backend, RemoteBackend):
        embedding = self.embedding_provider.embed([query])[0]
        entities = self.entity_extractor.extract(query)
        return self.backend.search_query(query, embedding=embedding, entities=entities, limit=search_limit)
    plan = self.router.plan(query)
    rankings: dict[str, list[str]] = {}
    results_by_id: dict[str, MemoryItem] = {}
    matched_by: dict[str, set[str]] = defaultdict(set)
    memory_type = plan.filters.get("memory_type")
    normalized_query = strip_intent_markers(query) or query

    if "semantic" in plan.strategies:
        embedding = self.embedding_provider.embed([normalized_query])[0]
        semantic_results = self.backend.search_by_vector(embedding, limit=self.config.semantic_limit, memory_type=memory_type)
        rankings["semantic"] = [item.id for item, _ in semantic_results]
```

逐段解释：

1. `limit == 0` 时回退到默认值。  
   这是为了让调用方可以只传 query，不必每次都指定 top-k。

2. `normalizedQuery := StripIntentMarkers(query)` 是一个非常重要的前处理。  
   它保证全文检索看到的是“内容词”，不是“为什么 / how to”这种问题模板词。

3. 编排器把各路结果分别塞进 `rankings`、`resultsByID`、`matchedBy`。  
   - `rankings` 用于 RRF  
   - `resultsByID` 用于后续回表和排序  
   - `matchedBy` 用于最终解释

4. `causal_trace` 不会盲目遍历全库，而是先选种子。  
   规则是：优先 semantic 的前两条，semantic 为空时退到 full-text。

5. 这条“取前 2 条做祖先追踪”的规则很像一个工程上的 recall cap。  
   它避免因果扩展把结果集无限撑大。

6. Python 端 `search()` 和 Go 端结构几乎一样。  
   这说明双端逻辑是对齐的，差别主要在远程路径的协议调用。

### 计算示例 (Worked Example)

对查询“为什么选择 SQLite”：

1. Router 判定为 `causal`
2. 先跑 semantic 和 full-text
3. 取 semantic 头两条作为 trace seed
4. 展开祖先链
5. 用 RRF 融合
6. 对最终结果执行 `touch_memory()`

如果 semantic 为空，则第三步会改用 lexical 头部结果做 seed。  
这是一个典型的回退设计：不让因果查询因为 semantic 缺失而完全失效。

---

## 10. 维护周期

### 直觉 (Intuition)

记忆系统是活系统。若没有定期维护，旧记忆会越来越多，冲突边会积累，健康指标会失真。维护周期负责把衰减、升降层、冲突扫描和合并候选统一串起来。

### 公式 (Formula)

维护周期更适合看作一个阶段式流程：

$$
\text{maintain} = \text{decay check} \rightarrow \text{layer transition} \rightarrow \text{conflict upkeep} \rightarrow \text{consolidation}
$$

### 代码解读 (Code Walkthrough)

代码位置：`src/agent_memory/client.py:259`

```python
def maintain(self) -> MaintenanceReport:
    report = MaintenanceReport()
    now = datetime.now(timezone.utc)
    for memory in self.backend.list_memories():
        age_days = max((now - memory.last_accessed).total_seconds() / 86400.0, 0.0)
        strength = self.forgetting_policy.effective_strength(memory, age_days=age_days)
        next_layer = self.forgetting_policy.next_layer(memory, age_days=age_days)
        updated = memory
        if next_layer is not memory.layer:
            updated = replace(updated, layer=next_layer)
            if next_layer is MemoryLayer.LONG_TERM:
                report.promoted += 1
            else:
                report.demoted += 1
        if strength < 0.1 and age_days > 60:
            if self.backend.soft_delete_memory(memory.id):
                report.decayed += 1
            continue
        if updated is not memory:
            self.backend.update_memory(updated)
    for memory in self.backend.list_memories():
        conflicts = self.detect_conflicts(memory)
        report.conflicts_found += len(conflicts)
        if conflicts:
            report.conflicts_resolved += self._apply_conflicts(memory, conflicts)[1]
    report.consolidated = self.consolidate()
    return report
```

逐段解释：

1. `age_days = total_seconds() / 86400.0` 把时间差统一换算成天。  
   前面所有遗忘公式都以“天”为单位，所以这里必须统一口径。

2. `effective_strength()` 和 `next_layer()` 连续调用。  
   前者判断“值有多大”，后者判断“层该不该变”。

3. `if next_layer is not memory.layer` 表示只在层真的变化时回写。  
   这能减少无意义更新。

4. `strength < 0.1 and age_days > 60` 时触发软删除。  
   这体现了一个双条件门槛：既要非常弱，又要足够老。

5. 第一轮循环结束后，再重新扫一次记忆做 conflict upkeep。  
   这说明维护流程把“层迁移”和“冲突修补”分成了两个阶段。

6. 最后调用 `consolidate()`，把可合并的候选收口成新记忆。  
   返回值直接写入 `report.consolidated`。

#### `MaintenanceReport` 字段说明

| 字段 | 含义 |
|------|------|
| `promoted` | 本轮升到长期层的数量 |
| `demoted` | 本轮降回短期层的数量 |
| `decayed` | 本轮因过旧且过弱而被软删除的数量 |
| `conflicts_found` | 本轮扫描到的冲突候选数 |
| `conflicts_resolved` | 本轮真正应用的冲突处理数 |
| `consolidated` | 本轮新建的合并记忆数 |

### 计算示例 (Worked Example)

假设一次维护扫描 100 条记忆：

- 8 条强度超过 `0.7`，升级为 `long_term`
- 5 条强度低于 `0.3`，降回 `short_term`
- 2 条强度低于 `0.1` 且超过 60 天，被软删除
- 3 对记忆进入冲突候选，其中 2 对真正落边
- 2 组记忆进入合并候选

那么报告可能是：

```json
{
  "promoted": 8,
  "demoted": 5,
  "decayed": 2,
  "conflicts_found": 3,
  "conflicts_resolved": 2,
  "consolidated": 2
}
```

---

## 小结

## 补充专题 A：意图模式完整列表与设计细节

计划里要求这里展示完整的关键词模式。下面把 Go 和 Python 版本都列出来。

文件：`go-server/internal/controller/router.go:26`

```go
var intentPatterns = []struct {
	Intent   Intent
	Patterns []string
}{
	{IntentCausal, []string{"为什么", "为何", "导致", "cause", "caused", "why"}},
	{IntentTemporal, []string{"上周", "最近", "之前", "刚才", "when", "recent", "before"}},
	{IntentProcedural, []string{"如何", "怎么", "步骤", "how to", "how do", "step"}},
	{IntentExploratory, []string{"关于", "all about", "everything about", "related to"}},
	{IntentFactual, []string{"什么是", "谁是", "what is", "who is", "which"}},
}
```

文件：`src/agent_memory/controller/router.py:10`

```python
INTENT_PATTERNS: list[tuple[QueryIntent, tuple[str, ...]]] = [
    (QueryIntent.CAUSAL, ("为什么", "为何", "导致", "cause", "caused", "why")),
    (QueryIntent.TEMPORAL, ("上周", "最近", "之前", "刚才", "when", "recent", "before")),
    (QueryIntent.PROCEDURAL, ("如何", "怎么", "步骤", "how to", "how do", "step")),
    (QueryIntent.EXPLORATORY, ("关于", "all about", "everything about", "related to")),
    (QueryIntent.FACTUAL, ("什么是", "谁是", "what is", "who is", "which")),
]
```

可以看到，两边不是“意思差不多”，而是完全对齐。  
这种对齐对双模式系统很重要，因为它决定了同一个 query 在 embedded 和 remote 下尽量得到同口径的计划。

### `strip_intent_markers()` 为什么必要

文件：`go-server/internal/controller/router.go:94`

```go
var intentMarkerPattern = regexp.MustCompile(`(?i)(为什么|为何|导致|what is|who is|how to|how do|all about|everything about)`)

func StripIntentMarkers(query string) string {
	return strings.TrimSpace(intentMarkerPattern.ReplaceAllString(query, " "))
}
```

文件：`src/agent_memory/controller/router.py:59`

```python
def strip_intent_markers(query: str) -> str:
    pattern = re.compile(r"(为什么|为何|导致|what is|who is|how to|how do|all about|everything about)", re.IGNORECASE)
    return pattern.sub(" ", query).strip()
```

它的价值在于：  
“为什么选择 SQLite” 这类 query，如果直接拿去做全文检索，`为什么` 本身会变成搜索词。  
而 `为什么` 并不是知识内容，只是意图提示。所以先剥掉它，全文检索才会更聚焦真正内容词。

## 补充专题 B：冲突检测的完整标记与 LLM 裁判流程

文件：`src/agent_memory/controller/conflict.py:14`

```python
NEGATION_MARKERS = ("不", "没", "不是", "不会", "never", "not", "no ")
PREFERENCE_MARKERS = ("喜欢", "偏好", "prefer", "prefers", "using", "uses", "选择", "selected")
CONFLICT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "label": {"type": "string", "enum": ["contradicts", "supersedes", "supports", "related", "none"]},
        "confidence": {"type": "number"},
        "reason": {"type": "string"},
    },
    "required": ["label", "confidence", "reason"],
    "additionalProperties": False,
}
```

这里比前文多补了两个关键点。

### 1. 完整极性与偏好标记

- 极性标记：`不`、`没`、`不是`、`不会`、`never`、`not`、`no`
- 偏好标记：`喜欢`、`偏好`、`prefer`、`prefers`、`using`、`uses`、`选择`、`selected`

它们的作用是把“文本相似”进一步细分成“语义接近但立场相反”“语义接近且在表达偏好”等更可解释的模式。

### 2. LLM 裁判不是一直触发

文件：`src/agent_memory/controller/conflict.py:60`

```python
if self.llm_client is None or similarity < 0.4:
    return heuristic_label, heuristic_confidence, heuristic_reason
```

这说明 LLM 复判至少满足两个条件：

1. 当前真的配置了 `llm_client`；
2. 候选与已有记忆的语义相似度已经达到 `0.4` 以上。

也就是说，系统把 LLM 放在“高价值、模糊候选”的第二层，而不是拿它扫全量记忆。

### 3. LLM 输出被 JSON Schema 限住

`generate_json(..., schema=CONFLICT_SCHEMA, schema_name="memory_conflict_judgement")` 的价值在于，模型不能随便返回一句自然语言，它必须回到：

- `label`
- `confidence`
- `reason`

这让后续代码可以稳地消费结果，也让冲突解释更结构化。

## 补充专题 C：算法之间是如何串起来的

如果把前面 10 个算法模块放在一起看，系统其实形成了一条完整闭环：

1. **写入阶段**：embedding、trust、entity extraction、conflict detection；
2. **检索阶段**：intent routing、多路召回、RRF、causal trace；
3. **维护阶段**：effective strength、next layer、consolidation。

换句话说，这不是 10 个彼此独立的小技巧，而是一整套围绕长期记忆生命周期展开的策略集合。

### 写入闭环

- `TrustScore` 决定“初始该有多可信”；
- `ConflictDetector` 决定“和旧记忆冲不冲突”；
- `RelationEdge` 决定“它跟别的记忆怎么连起来”。

### 查询闭环

- `Router` 决定“先查哪几路”；
- `RRF` 决定“多路结果怎么合”；
- `TraceAncestors` 决定“要不要把因果上下文带回来”。

### 维护闭环

- `EffectiveStrength` 决定“当前还能不能保住”；
- `NextLayer` 决定“升层还是降层”；
- `Consolidation` 决定“是否该合并成更高层摘要”。

这样看完整套系统，算法的价值就不只是单点技巧，而是跨写入、检索、治理三个阶段的协同。

## 补充专题 D：十个算法模块的输入、输出和副作用

如果想把这篇文档彻底讲透，一个非常有效的方式是，把每个算法模块当成“函数接口”来记。

| 模块 | 主要输入 | 主要输出 | 典型副作用 |
|---|---|---|---|
| `EffectiveStrength` | 记忆对象、年龄 | 强度分数 | 无 |
| `NextLayer` | 记忆对象、年龄 | 新层级 | 无 |
| `ReciprocalRankFusion` | 多路排名 | 融合分数表 | 无 |
| `Router.Plan` | query 文本 | 策略列表 + 过滤条件 | 无 |
| `TrustScorer.Score` | 来源可靠度、年龄、旁证数、冲突数 | trust score | 无 |
| `ConflictDetector.detect` | candidate memory | `ConflictRecord[]` | 可能触发 LLM 复判 |
| `ConsolidationPlanner.find_merge_groups` | 全量记忆列表 | merge groups | 无 |
| `cosineSimilarity` | 两个向量 | 相似度 | 无 |
| `_build_fts_query` | query 文本 | FTS5 查询表达式 | 无 |
| `maintain` | 全量记忆 | `MaintenanceReport` | 会更新层级、软删除、建冲突边、触发合并 |

这个表格的好处是，它会让你明确区分：

- 哪些算法纯计算；
- 哪些算法会改数据；
- 哪些算法会触发额外外部依赖，例如 LLM。

## 补充专题 E：算法层的失败与回退策略

一个真正可用的系统，不能只讨论“算法正确时会怎样”，还要讨论“算法拿不到理想输入时怎么办”。

### 1. query 里没有明显意图词

这时 `Router.Classify()` 会返回 `GENERAL`，对应的 plan 是：

- `semantic`
- `full_text`

这条回退路径很保守，也很合理。  
它至少保证系统不会因为意图分类失败，就让搜索能力塌掉。

### 2. query 提取不到实体

这时 entity 召回那一路结果可能为空，但 semantic 和 full-text 仍会继续工作。  
这说明多路召回的稳定性来自“有一路弱了，别的路还能顶上来”。

### 3. semantic 结果为空

在 `causal_trace` 策略里，系统会先尝试 semantic 前两条做种子；如果 semantic 没结果，就退到 full-text 前两条。  
这是编排层一个很典型的兜底设计。

### 4. LLM 冲突复判失败

当前 `ConflictDetector` 的逻辑是：

- 如果没有 `llm_client`，直接走启发式；
- 如果 LLM 调用抛异常，也直接退回启发式结果。

也就是说，LLM 复判是加分项，不是系统生死依赖。

### 5. `sqlite-vec` 不可用

Python `SQLiteBackend` 会优先尝试打开 `sqlite-vec`。  
如果：

- 没装扩展；
- 扩展加载失败；
- 当前环境不支持；

就退回纯 Python 余弦扫描。

这也是这个项目“本地优先”非常典型的一种工程风格：  
优先吃高级能力，但绝不把系统绑死在高级能力上。

## 补充专题 F：算法层的三类取舍

### 取舍 1：稳定性优先于最优理论分数

RRF、规则路由、启发式冲突检测这些设计，有一个共同点：  
它们都不是最“花哨”的方法，但它们的行为稳定、可测、可解释。

对于长期记忆系统来说，这往往比追求单次 query 的理论最优更重要。

### 取舍 2：解释性优先于纯黑盒能力

例如冲突检测：

- 系统先给启发式理由；
- 再决定是否交给 LLM；
- 即使交给 LLM，输出也被 JSON Schema 约束。

这就让最终结果更容易复盘，也更容易和治理层联动。

### 取舍 3：回退路径优先于单一路径极致优化

这个项目很多模块都体现了“主路径 + 回退路径”的设计：

- intent router 有 `GENERAL` 回退；
- causal trace 有 lexical seed 回退；
- conflict judge 有 heuristic 回退；
- vector search 有 pure scan 回退。

这会让系统在复杂环境里更稳，而不是动不动就完全失效。

## 补充专题 G：如果把十个算法压缩成一段面试答案

如果面试官直接问你“你这个项目最核心的算法设计是什么”，一个比较完整但又不拖沓的回答可以是：

“我把算法层分成三段。第一段是写入治理，包括 trust score、冲突检测和结构关系建立；第二段是查询编排，包括意图路由、多路召回、RRF 融合和因果追踪；第三段是长期维护，包括遗忘曲线、层级迁移和记忆合并。这三段不是独立存在的，它们共同构成了一条从写入、检索到治理的闭环，所以系统既能记住内容，也能解释内容和管理内容。”

这段话的优点是：

1. 不会陷在某一个公式里；
2. 也不会把算法层讲散；
3. 能让面试官快速感受到你对整体有把握。

## 补充专题 H：算法层最值得继续优化的地方

从当前实现看，最值得继续演进的算法点有四个。

### 1. Router 可以从纯关键词继续进化

当前规则路由很稳定，但面对复合 query 仍会比较粗。  
后续可以考虑：

- 规则路由 + LLM 回退；
- 多标签意图，而不只是单一意图。

### 2. Trust score 可以引入更细的来源模型

目前 trust 的输入已经够清楚，但来源可靠度仍比较依赖调用方给出的初始值。  
后续可以加：

- source 类型映射；
- 历史命中率；
- 来源层级。

### 3. Conflict detector 可以增强 token-level 判断

当前实现已经有：

- 语义相似度；
- 文本归一化；
- 极性标记；
- 偏好标记；
- 可选 LLM 复判。

后续若要继续提升，可以考虑更显式的 token overlap 统计和时间上下文判断。

### 4. Consolidation 可以从“找可合并组”继续演化到“生成多层摘要”

现在合并的目标更像是“把相近记忆合成一条”。  
后续可以继续做：

- 层级化摘要；
- 面向主题的摘要；
- 带引用链的摘要。

这样长期层会更像一个可检索的“经验索引”，而不只是被动存放的旧记录。

## 补充专题 I：十个算法各自最容易被问到什么

为了方便面试和复盘，下面把十个算法各自最容易被问到的问题再单独列出来。

### 1. 艾宾浩斯遗忘曲线

最常见追问是：

- 为什么访问次数用对数；
- 为什么长短期层的 beta 不同；
- 为什么双阈值比单阈值更稳。

### 2. RRF

最常见追问是：

- 为什么不用加权平均；
- 为什么 `k=60`；
- 为什么只看排名会更稳。

### 3. 意图路由

最常见追问是：

- 为什么不用 LLM；
- 为什么默认回退到 `semantic + full_text`；
- 为什么要先 strip 掉意图标记词。

### 4. 信任评分

最常见追问是：

- 为什么来源权重最大；
- 为什么要把结果 clamp 到 `[0,1]`；
- 冲突为什么会直接拉低 trust。

### 5. 冲突检测

最常见追问是：

- 为什么不直接全量对比；
- LLM 复判什么时候触发；
- 为什么要保留关系边而不是直接覆盖。

### 6. 记忆合并

最常见追问是：

- 为什么先按实体分组；
- 为什么保留 `supersedes` 链；
- LLM 合并和启发式合并怎么选。

### 7. 余弦相似度

最常见追问是：

- 维度不一致怎么办；
- 零向量怎么办；
- 为什么 Go 版本把三项计算合在一个循环里。

### 8. FTS5

最常见追问是：

- 为什么还要独立的 FTS 表；
- 触发器为什么是 insert/delete/update 三套；
- 中文 query 如何拆 token。

### 9. 检索编排

最常见追问是：

- 为什么 trace seed 只取前两条；
- 为什么 touch 后再 get；
- 为什么 recency 排序只在某些意图下打开。

### 10. 维护周期

最常见追问是：

- 为什么要分两轮扫描；
- 为什么软删除阈值是 `strength < 0.1 and age > 60`；
- 为什么 consolidate 放在最后。

## 补充专题 J：算法层的三类证据

如果你想证明这些算法不是空谈，可以从三类证据来讲。

### 证据 1：源码证据

每个模块都有明确文件位置：

- Router：`go-server/internal/controller/router.go`
- Forgetting：`go-server/internal/controller/forgetting.go`
- Trust：`go-server/internal/controller/trust.go`
- Conflict：`src/agent_memory/controller/conflict.py`
- Consolidation：`src/agent_memory/controller/consolidation.py`

### 证据 2：行为证据

系统能直接展示：

- `matched_by`
- 祖先链
- trust score 变化
- conflict relation
- maintenance report

### 证据 3：测试证据

这些规则并不是只能手工看效果。  
仓库里已经有 router、forgetting、trust、orchestrator 相关测试与 benchmark。  
也就是说，算法层不只是写进文档里，而是被真正纳入了工程验证。

## 补充专题 K：什么时候该优先讲哪一个算法

不同面试官其实会对不同算法更感兴趣。  
如果你提前知道重点，表达会更省力。

### 面向 AI / 检索面试官

优先讲：

1. 意图路由；
2. 多路召回；
3. RRF；
4. 冲突检测。

因为这些点最能体现“为什么记忆系统不等于普通向量检索”。

### 面向后端 / 基础设施面试官

优先讲：

1. `AddMemory()` 的事务一致性；
2. `TraceAncestors()` 的递归 CTE；
3. Go 端余弦扫描与 Python 端 `sqlite-vec` 的差异；
4. 维护周期如何回写层级和删除状态。

因为这些点更贴近服务端实现与数据库行为。

### 面向综合面试官

优先讲：

1. 遗忘曲线；
2. RRF；
3. 冲突检测；
4. 维护周期。

这四个点最容易组成“写入—查询—治理”的完整故事。

- 遗忘、RRF、路由和冲突检测构成了系统的算法骨架
- Go 与 Python 在关键公式和策略上保持一致
- 当前方案强调规则化、可测性和可解释性
- 若要继续优化，最值得深挖的方向是 procedural recall、合并质量和冲突复判

## 延伸阅读

- [04 Go 服务端指南](04-go-server-guide.md)
- [05 Python SDK 指南](05-python-sdk-guide.md)
- [07 数据库与 Schema 指南](07-database-schema-guide.md)
- [11 性能与基准测试](11-performance-benchmarking.md)
