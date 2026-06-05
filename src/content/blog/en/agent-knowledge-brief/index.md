---
title: "A Brief Overview of Agent Knowledge"
description: "A systematic introduction to agents, from the four elements of an agent and LLM fundamentals to frameworks, memory, RAG, MCP, and Agentic RL."
publishDate: 2026-06-06
updatedDate: 2026-06-06
tags:
  - Agent
  - LLM
  - RAG
  - MCP
  - Prompt Engineering
language: English
heroImageSrc: ../../agent-knowledge-brief/cover.png
heroImageColor: "#4d76c3"
comment: true
draft: false
---

## Agent Fundamentals

### Definition and Four Elements

An **Agent** is an entity capable of perceiving its **Environment** through **Sensors**, and **autonomously** taking **Actions** through **Actuators** to achieve specific goals.

| Element | Description | Example |
| --- | --- | --- |
| **Environment** | The external world the agent inhabits | Road traffic, financial markets, game scenes |
| **Perception** | Continuously acquiring environmental state through sensors | Camera, microphone, radar, API interfaces |
| **Action** | Changing the environment state through actuators | Robotic arm movement, code invocation, text output |
| **Autonomy** | Core feature — independent decision-making based on perception and internal state | Planning a path autonomously rather than passively responding to commands |

### PEAS Task Environment Model

PEAS is a standardized framework for describing an agent's task environment, with four dimensions: **P**erformance, **E**nvironment, **A**ctuators, **S**ensors.

Using autonomous driving as an example: Performance is safe arrival, fuel efficiency, passenger comfort; Environment is roads, traffic signals, pedestrians, weather; Actuators are steering wheel, accelerator, brakes, turn signals; Sensors are cameras, LiDAR, GPS, inertial measurement units.

### Six Types of Agents — Evolutionary Path

Agent classification by decision architecture, evolving from simple to complex:

1. **Simple Reflex Agent**: Responds directly to current perception based on condition-action rules, without maintaining internal state. Example: a thermostat.

2. **Model-based Reflex Agent**: Adds an internal world model on top of the reflex architecture, with basic memory, capable of handling partially observable environments. Example: an autonomous car in a tunnel.

3. **Goal-based Agent**: Adds explicit representation of "goal states" on top of the model, capable of actively selecting actions that lead toward goals. Example: a GPS route planning system.

4. **Utility-based Agent**: Adds a utility function on top of goals, capable of weighing and prioritizing between multiple goals, selecting actions that maximize expected utility. Example: a navigation system that simultaneously considers time, fuel consumption, and tolls.

5. **Learning Agent**: Contains learning components that accumulate experience through interaction with the environment, continuously improving its own performance. Learning components include: the learning element (improvement algorithm), the performance element (action selection), the critic element (providing feedback), and the problem generator (exploring new experiences). Example: AlphaGo Zero.

6. **LLM-driven Agent**: Uses a pre-trained large language model as its "brain," with strong natural language understanding and generalization ability, capable of understanding vague instructions and combining planning and tool use to complete complex tasks. Example: an intelligent travel assistant.

### Three Classification Dimensions

Agents can be classified along three dimensions:

**By internal decision architecture**: Simple Reflex → Model-based → Goal-based → Utility-based → Learning.

**By temporality and reactivity**: Reactive (millisecond response, no planning, e.g., airbags, high-frequency trading systems); Deliberative (acts after careful deliberation, e.g., chess AI, business planning systems); Hybrid (combining both, most LLM agents fall into this category).

**By knowledge representation**: Symbolism (rules + logic, strong interpretability but fragile); Sub-symbolism (neural networks, strong expressiveness but black-box); Neuro-symbolism (fusion of both, represented by LLM agents).

### Operating Mechanism: Perception-Thought-Action-Observation Loop

The agent operates in a closed loop:

```
Perception → Thought → Action → Observation → Loop
                  ├── Planning
                  └── Tool Selection
```

The meaning of each stage in the loop:

- **Thought**: Natural language "snapshots" of internal reasoning processes, including analysis of the current state and deliberation on the next steps
- **Action**: Specific operations expressed as function calls, formatted as `{tool_name}[{tool_input}]`
- **Observation**: Natural language descriptions of environmental feedback, serving as input for the next round of reasoning

### Core Differences Between Regular LLM Calls and Agents

A regular LLM call is a single-round Q&A mode — the model receives a question and directly generates a response, lacking continuous pursuit of a goal and the ability to intervene in the external world. An Agent, on the other hand, is a continuous control loop with three essential differences:

- An Agent maintains a clear **goal state** and can continuously pursue it across multiple rounds of interaction
- An Agent has **action capability**, able to influence the external environment through tool calls and receive feedback
- An Agent can **dynamically adjust plans**, revising subsequent strategies based on intermediate results during execution

### Six Core Characteristics

An LLM-driven Agent must possess six core capabilities:

- **Reasoning**: Logical analysis and step-by-step deduction of problems
- **Tool Use**: Identifying scenarios requiring external tools and calling them correctly
- **Memory**: Maintaining short-term context and long-term knowledge
- **Planning**: Decomposing goals into executable sub-steps
- **Self-Improvement**: Optimizing its own performance through feedback mechanisms
- **Perception**: Acquiring information from the environment

---

## History of Agent Development

### Symbolism (1950s–1980s)

The core theory was the **Physical Symbol System Hypothesis (PSSH)** proposed by Newell and Simon in 1976: the essence of intelligence = representation of symbols + manipulation of symbols. Any system that can perform functions through symbol representation and manipulation has the necessary and sufficient conditions for intelligence.

**Representative systems**:

- **GPS (General Problem Solver)**: Used means-ends analysis to transform differences between the current state and goal state into executable actions. Performed well on theorem proving and logical reasoning tasks.
- **MYCIN**: A medical diagnosis expert system developed at Stanford, containing over 600 rules manually written by domain experts. Its accuracy in diagnosing bacterial infections and recommending antibiotics exceeded that of some human doctors.
- **SHRDLU**: A blocks-world agent developed by Terry Winograd, capable of understanding natural language commands (e.g., "Put the red block on top of the green one") in a constrained virtual environment and executing them.

**Core limitations**:

- Knowledge acquisition bottleneck: Rules had to be written one by one by domain experts and knowledge engineers, extremely inefficient
- System brittleness: Performance sharply degraded when encountering inputs outside the rule boundaries
- Lack of common sense: Unable to handle commonsense reasoning that humans take for granted
- Frame problem: Unable to effectively filter which environmental changes are relevant to the current goal

### Connectionism (1980s–2010s)

The core idea was to let machines learn from data rather than relying on manually written rules. The key breakthrough was the proposal of **backpropagation** in 1986, which made training multi-layer neural networks possible — computing gradients of the loss function with respect to each weight via the chain rule, propagating error signals backward from the output layer to the input layer.

Representative systems include TD-Gammon (a reinforcement learning application using temporal difference learning, achieving human expert-level backgammon AI through self-play) and DQN (Deep Q-Network, combining deep learning with Q-Learning, achieving superhuman performance in Atari games).

Connectionism's core contribution: solving the knowledge acquisition bottleneck faced by symbolism (no longer needing manually written rules), automatically extracting features and patterns through large-scale data training. Limitations: poor model interpretability, training requires large amounts of labeled data, prone to overfitting.

### Deep Learning (2010s–2022)

Represented by AlexNet (2012 ImageNet competition winner, introducing ReLU activation and Dropout regularization, marking the beginning of the deep learning era), AlphaGo (defeated Go world champion Lee Sedol in 2016, combining deep neural networks with Monte Carlo tree search), ResNet (proposed residual connections in 2015, solving the degradation problem of deep networks, enabling training of hundreds of layers).

### LLM-Driven Era (2022–Present)

Modern agents adopt the "Perception-Thought-Action-Observation" closed loop, using GPT-series models as the brain. Key milestones:

- 2022: ReAct paper proposed the paradigm of interleaving reasoning and acting; Toolformer paper proposed a self-supervised method for models to learn inserting API call tokens into text
- 2023: AutoGPT, BabyAGI demonstrated the feasibility of autonomous agents; Generative Agents paper showed agents simulating social behavior
- 2024–2025: MCP protocol standardized tool integration; Agentic-RL introduced reinforcement learning; multi-agent collaboration systems deployed in production

### Minsky's Society of Mind Theory

Marvin Minsky proposed that intelligence arises from **diverse collaboration**, not a single perfect reasoning principle. He argued that the human mind consists of numerous relatively simple "agents" organized hierarchically that collaborate with each other. This theory laid the foundation for **Multi-Agent Systems (MAS)** and explains why multi-agent collaboration architectures often exceed the capability ceiling of single agents.

---

## A Little LLM Foundation

### Language Model Evolution

N-gram models → static word embeddings (Word2Vec, GloVe) → recurrent neural networks (RNN, LSTM) → Transformer.

The pivotal turning point was the Transformer architecture's **self-attention mechanism**, which solved two problems of RNNs for sequence processing: difficulty capturing long-distance dependencies and inability to parallelize computation.

### Transformer Core Architecture

**Self-Attention**:

Each input token generates three vectors: Query, Key, Value. The attention weight computation process: Q computes dot-product similarity with all Ks → Softmax normalization to obtain weights → weighted sum with V. This allows the model, when processing each token, to dynamically attend to all other tokens in the sequence.

**Multi-Head Attention**:

Multiple sets of Q/K/V attention are computed in parallel, with each set focusing on different semantic subspaces (syntactic relationships, dependency relations, semantic associations, etc.), and finally all head outputs are concatenated and linearly transformed.

**Positional Encoding**:

Since self-attention inherently lacks sequence position information, positional encoding must be explicitly injected. The original Transformer paper used fixed-frequency sine and cosine functions; modern models mostly use learnable positional encodings (e.g., GPT series) or rotary positional encoding (RoPE, e.g., LLaMA series).

**Feed-Forward Network (FFN)**:

The representation at each position passes through two layers of linear transformation (intermediate layer expands features, output layer reduces back to original dimension) and a non-linear activation function (e.g., ReLU, GELU). The FFN shares parameters across all positions, performing higher-level abstraction on top of the context representations extracted by the attention mechanism.

### Three Architecture Variants

- **Encoder-Only (BERT)**: Bidirectional attention, suitable for understanding tasks like text classification, sequence labeling, semantic matching. Training objective is typically masked language modeling (MLM).
- **Decoder-Only (GPT series)**: Causal attention (each token can only attend to itself and previous tokens), suitable for text generation tasks. This is the mainstream architecture choice for current large language models.
- **Encoder-Decoder (T5)**: Encoder for bidirectional understanding + decoder for autoregressive generation, suitable for sequence-to-sequence tasks (translation, summarization).

### Tokenization

Mainstream tokenization algorithms:

- **BPE (Byte Pair Encoding)**: Used by GPT series. Starts from character level, iteratively merges the most frequent adjacent token pairs. No special tokens or predefined vocabulary needed — learns subword segmentation automatically.
- **WordPiece**: Used by BERT. Similar to BPE but uses mutual information maximization as the merge criterion (selecting the pair that maximizes data likelihood), rather than pure frequency-based merging.
- **SentencePiece**: Used by T5, LLaMA. Treats raw text directly as a sequence of Unicode characters, does not rely on space splitting, natively supports multiple languages. The original T5 model training used a variant of BPE (Unigram LM).
- **Tiktoken**: High-performance tokenization library developed by OpenAI, using the BPE algorithm optimized for GPT-series models, several times faster than HuggingFace tokenizer.

The granularity of tokenization directly affects the model's effective context length and cross-lingual capability.

### Sampling Parameters

Three core parameters controlling LLM output randomness:

- **Temperature**: Controls the "sharpness" of the probability distribution. As values approach 0, the highest probability token is almost deterministically selected — output is deterministic but lacks diversity. Higher values flatten the distribution, giving low-probability tokens a chance to be selected — output is more diverse. Typically 0.7–0.9 for creative tasks, 0.1–0.3 for precise reasoning tasks.

- **Top-k**: During decoding, only samples from the k tokens with the highest probabilities, setting the rest to zero and renormalizing. Prevents the "long tail" of the probability distribution from being contaminated by low-probability tokens.

- **Top-p (nucleus sampling)**: Sets a cumulative probability threshold p (e.g., 0.9), keeping only the smallest set of tokens whose cumulative probability first exceeds p. Unlike Top-k's fixed count, Top-p dynamically adjusts the candidate set size based on the current probability distribution.

In practice, Top-k and Top-p are often combined: first keep the Top-k tokens, then apply Top-p filtering among them.

### In-Context Learning (ICL)

ICL is one of the most critical emergent abilities of LLMs: by simply placing input-output examples in the prompt, the model can infer the task pattern and generalize correctly, without any parameter updates.

**Essential difference from fine-tuning**: SFT changes model parameters through gradient updates — it's "learning." ICL doesn't modify model parameters at all, only leveraging the pattern-matching abilities the model learned during pre-training. ICL effectiveness depends on model scale — small models (<1B parameters) have almost no ICL ability, ICL emerges as model size increases.

**How ICL works**: One mainstream hypothesis is "task induction" — the example sequence in the prompt activates similar patterns the model has seen during pre-training, and the model uses the attention mechanism to locate these patterns and extend them to the final output. The examples in the prompt act as "task format indicators" rather than "new knowledge injection."

**Usage in agents**: ICL is used in agent systems for two scenarios — **system-level static examples** (placing fixed-format tool call examples in the system prompt to ensure the agent always outputs in a standard format) and **runtime dynamic examples** (dynamically selecting the most relevant examples based on current context, typically in RAG scenarios).

### Prompt Engineering

**Zero-shot**: Directly giving task descriptions, with the model relying on generalization ability learned during training. Suitable for common tasks where large models (>100B parameters) already have sufficient capability.

**Few-shot**: Providing several input-output examples in the prompt, with the model inferring the task pattern through in-context learning. Typically 3–10 examples; too many may exceed the context window limit.

**Chain-of-Thought (CoT)**: Adding examples of intermediate reasoning steps in the prompt, guiding the model to generate step-by-step reasoning before outputting the final answer. Significantly improves accuracy on tasks requiring multi-step logical deduction (math problems, logical reasoning, commonsense reasoning). Can be divided into manually written CoT examples and zero-shot CoT (simply adding trigger phrases like "Let's think step by step").

**Tree of Thoughts (ToT)**: Expanding the reasoning process into a tree-like search structure. Each node represents a reasoning state or intermediate conclusion, starting from the root node to explore multiple reasoning paths. Each path is evaluated and scored by the LLM itself, and search strategies (BFS or DFS) are used to select the optimal path. Suitable for complex problems that require exploring multiple possibilities with multiple feasible solution paths.

**Self-Consistency**: Sampling the same problem multiple times (using slightly higher Temperature), then selecting the most frequent answer through majority voting or weighted voting. Exploits the randomness of each LLM generation — although a single attempt may be wrong, the consensus of multiple samples tends toward correctness.

### Training Paradigm

LLM training consists of three stages:

1. **Pre-training**: Training the next token prediction task on massive amounts of unlabeled text (typically terabytes). At this stage, the model focuses on token co-occurrence and sequence patterns in the text, learning the foundations of linguistic knowledge, world knowledge, and reasoning ability. Requires enormous compute resources (thousands of GPU hours).

2. **Instruction Fine-tuning (SFT)**: Continuing training on human-annotated or synthetically generated instruction-response data. The data format is `{instruction, input, expected output}` triples. Concrete examples:

```
{
  "instruction": "Calculate the sum of 25 and 37",
  "input": "",
  "output": "25 + 37 = 62"
}
{
  "instruction": "Write a Python function to calculate the Fibonacci sequence",
  "input": "n = 10",
  "output": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))"
}
```

This stage teaches the model to follow instructions and format responses, transforming it from "can complete text" to "can answer questions."

3. **Reinforcement Learning from Human Feedback (RLHF)**: Divided into three sub-steps — collecting human preference data (ranking multiple model outputs for the same prompt) → training a reward model (learning to predict human preferences) → optimizing the policy model with the PPO algorithm (maximizing the reward model score for model outputs). RLHF makes model outputs better aligned with human expectations in terms of language quality, factuality, and safety.

LoRA (Low-Rank Adaptation) is a parameter-efficient fine-tuning method. For a pre-trained weight matrix W, LoRA decomposes its update ΔW into the product of two low-rank matrices A and B (ΔW = B·A), training only the A and B parameters while freezing the original weights. After training, the low-rank matrices are merged back into the original weights, with no additional inference latency. For example, fine-tuning Qwen3-0.6B with LoRA requires only about 4GB of VRAM.

### Scaling Laws and Emergent Abilities

Scaling Laws reveal a power-law relationship between model performance and three factors: model parameter count (N), training data size (D), and computational resources (C). When all three increase proportionally on a logarithmic scale, model performance improves following a power law, with no clear inflection point of diminishing returns.

When model scale crosses a certain threshold, abilities that small models lack emerge:

- **In-Context Learning**: Understanding tasks through examples in the prompt alone, without gradient updates
- **Chain-of-Thought Reasoning**: Performing multi-step logical reasoning
- **Instruction Following**: Understanding and executing instructions described in natural language
- **Tool Calling**: Identifying scenarios requiring external tools and generating structured parameters

### The Hallucination Problem

Hallucination refers to models generating content inconsistent with facts. Divided into three types:

- **Factuality hallucination**: Generating content contradicting known facts
- **Faithfulness hallucination**: Generating content inconsistent with user instructions or conversation history
- **Intrinsic hallucination**: Generating content contradicting knowledge in the model's own training data

Mitigation approaches: RAG (retrieving relevant documents as generation basis), external tool verification (calling search engines or databases to verify facts), multi-model voting (multiple models independently judging factuality), hallucination detection prompts (adding "if your answer contains information you're not confident about, please mark it").

### Toolformer: Teaching Models to Use Tools

Toolformer, proposed by Meta AI in 2023, is a method whose core idea is not to modify the model architecture but to teach language models through self-supervised learning to call external tools (calculators, search engines, translation systems, etc.) at appropriate times.

**API call representation**: Special tokens mark the start and end of API calls within the text sequence: `<API> a_c(i_c) </API>` (no result state) and `<API> a_c(i_c) → r </API>` (with result state). Through this design, API calls can be seamlessly inserted into the text generation process.

**Training data construction** follows a three-stage process of "sample-execute-filter":

1. **Sampling stage**: Uses a small number of manually written few-shot examples to guide the model in finding potential tool call positions in the text, generating the probability of `<API>` tokens at each position, retaining positions with probability above a threshold
2. **Execution stage**: Actually calls the corresponding API, obtaining real return results
3. **Filtering stage**: Compares the weighted cross-entropy loss with and without the API call. Only retains the sample if the API call significantly reduces the loss

**Inference process**: The model decodes normally. When it outputs the `→` token, the system pauses to execute the API call, inserts the result into the text, and continues decoding.

**Experimental results**: Toolformer (6.7B parameters) surpassed GPT-3 (175B parameters) on zero-shot tasks, without sacrificing the model's native language capabilities — fact completion accuracy improved from 39.8% to 53.5%, math task accuracy from 14.0% to 40.4%.

**Limitations**: Only supports single non-iterative calls (cannot form tool chains), no cost awareness (doesn't consider API latency and cost), fixed API set (requires retraining to add new tools), sensitive to prompting.

---

## Classic Agent Paradigms

### ReAct

ReAct (Reasoning + Acting), proposed by Shunyu Yao in 2022, is currently the most widely used agent paradigm. Its core idea is to tightly integrate reasoning and acting into a **Thought → Action → Observation** loop.

#### Loop Structure

The entire execution process is a while loop, with each iteration containing six steps:

1. **Format prompt**: Assemble system instructions, available tool descriptions, the current question, and historical interaction records into the current round's prompt
2. **Call LLM**: Send the prompt to the LLM and get a response
3. **Parse output**: Extract Thought and Action fields from the LLM response
4. **Check termination**: If the action is `Finish[final_answer]`, output the result and end the loop
5. **Execute tool**: If the action is `{tool_name}[{tool_input}]`, call the corresponding tool to get an Observation
6. **Update history**: Append the action and observation to the history, return to step 1 and continue

#### System Prompt Template

```
Please note that you are an intelligent assistant capable of calling external tools.

Available tools are as follows:
{tools}

Please respond strictly in the following format:

Thought: [Your reasoning process for analyzing the problem, decomposing the task, and planning the next action]
Action: The action you decide to take, must be one of the following formats:
- `{tool_name}[{tool_input}]`: Call an available tool.
- `Finish[final_answer]`: When you believe you have reached the final answer.

Now, please start solving the following problem:
Question: {question}
History: {history}
```

#### Core Code Implementation

```python
class ReActAgent:
    def __init__(self, llm_client, tool_executor, max_steps=5):
        self.llm_client = llm_client
        self.tool_executor = tool_executor
        self.max_steps = max_steps
        self.history = []

    def _parse_output(self, text):
        """Extract Thought and Action from LLM response"""
        thought_match = re.search(r"Thought: (.*?)Action:", text, re.DOTALL)
        action_match = re.search(r"Action: (.*)", text, re.DOTALL)
        thought = thought_match.group(1).strip() if thought_match else None
        action = action_match.group(1).strip() if action_match else None
        return thought, action

    def _parse_action(self, action_text):
        """Parse Action string, separating tool name and arguments"""
        match = re.match(r"(\w+)\[(.*)\]", action_text)
        if match:
            return match.group(1), match.group(2)
        return None, None

    def run(self, question):
        self.history = []
        for current_step in range(self.max_steps):
            tools_desc = self.tool_executor.get_available_tools()
            history_str = "\n".join(self.history)
            prompt = REACT_PROMPT_TEMPLATE.format(
                tools=tools_desc, question=question, history=history_str,
            )
            messages = [{"role": "user", "content": prompt}]
            response_text = self.llm_client.think(messages=messages)
            thought, action = self._parse_output(response_text)

            if action.startswith("Finish"):
                final_answer = re.match(r"Finish\[(.*)\]", action).group(1)
                return final_answer

            tool_name, tool_input = self._parse_action(action)
            observation = self.tool_executor.execute(tool_name, tool_input)
            self.history.append(f"Action: {action}")
            self.history.append(f"Observation: {observation}")

        return None
```

#### Running Example

Using the query "Huawei's latest phone" as an example:

```
--- Step 1 ---
Thought: I need to find the latest phone model released by Huawei, I'll use the search tool.
Action: Search[Huawei latest phone model and key selling points]
Observation: [Result list: HUAWEI Pura 70 series... Mate 60 Pro...]

--- Step 2 ---
Thought: Based on the search results, Pura 70 is the latest release, let me summarize the selling points.
Action: Finish[The latest Huawei flagship is the HUAWEI Pura 70 series, with selling points including...]
```

#### Pros and Cons

Advantages: High interpretability (Thought chain fully traces the decision process), dynamic planning (each step can adjust strategy based on previous step's results), tool synergy (LLM handles planning, tools handle execution).

Drawbacks: Strongly dependent on model capability (poor LLM reasoning leads to poor results), low execution efficiency (serial loops require multiple LLM calls), fragile prompting (format or punctuation changes can cause parsing failure), may fall into local optima or reasoning dead loops.

### Plan-and-Solve

Plan-and-Solve adds an explicit **global planning** stage on top of ReAct. The agent first creates a complete execution plan, then executes it step by step, adjusting the plan as needed during execution.

**Architecture**: Collaborates through two components — the Planner decomposes complex tasks into a series of logically clear sub-steps (outputting a structured step list), and the Executor strictly implements each step one by one, passing the original problem, the complete plan, and historical results as context to the model at each step.

**Core Prompt Template**:

```
You are a "plan first, execute later" agent.
Available tools are as follows:
{tools}

Please first analyze the problem, generate a complete execution plan (list of steps), then execute strictly according to the plan.

Problem: {question}

Please first output the plan (Plan), then execute it step by step (Execute).
```

In practice, the Planner and Executor prompts are designed separately: the Planner prompt asks the model to output a structured list of steps; the Executor prompt takes the original problem + complete plan + results of completed steps, asking the model to continue executing according to the plan.

Difference from ReAct: ReAct is suitable for exploratory tasks where you "figure it out as you go," with each step's reasoning relying on the previous step's observation. Plan-and-Solve is suitable for multi-step tasks with relatively clear logical paths, such as writing code (plan the file structure first, then implement each component). The former is flexible but may lack direction; the latter is stable but lacks flexibility.

### Reflection

The Reflection paradigm gives agents the ability to evaluate their own outputs and make corrections. The paper "Self-refine: Iterative refinement with self-feedback" demonstrates that across all tasks and all tested models (GPT-3.5, GPT-4, Claude), the reflection mode comprehensively outperforms direct generation.

#### Flow and Prompt Templates

The process includes three stages, each with its own prompt template:

1. **Execution stage**: The agent generates an initial response to the task

```
Please complete the following task:
Task: {task}
Please output the final result directly, without any extra opening or closing explanations.
```

2. **Reflection stage**: The agent evaluates its own response, looking for factual errors, logical gaps, or inconsistencies

```
You are an extremely strict review expert. Please examine the quality, accuracy, and logic of the following content.
Task: {task}
Current content:
{content}

Please point out shortcomings and provide specific improvement suggestions. If the content is already perfect and meets the highest standards, strictly and only output the four words "No improvements needed."
```

3. **Refinement stage**: Generates an improved version based on the evaluation, can be iterated multiple times

```
Please optimize your previously generated content based on the review expert's feedback.
Task: {task}
Reviewer's feedback:
{feedback}
Please directly output the optimized complete new content, without any extra explanation.
```

#### Producer-Critic Mode

The Producer and Critic use **different system prompts**, with separated responsibilities to avoid the cognitive bias of "writing and reviewing your own work." In practice, different models can be used (e.g., a fast model for generation, a stronger model for reflection).

#### Stopping Conditions

Stopping conditions for the reflection loop include: the Critic deems the output satisfactory (returns a "no improvements needed" signal); maximum iteration count reached (typically 2–3 rounds); improvement magnitude below a set threshold.

#### Applicable Self-Check Dimensions

| Check Type | Content |
| --- | --- |
| Structure self-check | Is the output format complete? Does it include all required fields? |
| Fact self-check | Does it contain unverifiable facts? Could it mislead users? |
| Tool behavior self-check | Was the tool call successful? Is the error message empty? |
| Reasoning logic self-check | Are there logical leaps? Missing key steps? Unexplained assumptions? |

The core value of Reflection: enabling agents to self-correct using the model's own ability to judge "right" and "wrong" without external feedback. Highly effective in tasks where output can be self-verified, such as code generation (checking syntax errors and logic bugs) and mathematical reasoning (checking calculation processes).

### Tree of Thoughts (ToT)

ToT models the reasoning process as a tree-structured search, where each node represents a reasoning state (a line of thought or intermediate conclusion), starting from the root node (the original problem) to explore multiple possible reasoning paths.

**Evaluation and search**: Each intermediate node is evaluated and scored by the LLM itself (assessing "is this reasoning path feasible"), then search strategies determine which paths to explore next. This approach combines traditional search algorithms with the LLM's semantic evaluation ability.

**Two search strategies**: Breadth-First Search (BFS) expands layer by layer, keeping the k highest-scoring nodes per layer, suitable for problems with shallow branching but wide breadth. Depth-First Search (DFS) follows one path deep until reaching a leaf node (final answer or dead end), then backtracks to the previous branching point, suitable for problems with deep branching but narrow width.

**Applicable scenarios**: Tasks requiring exploration of multiple possibilities where intermediate results can be independently evaluated, such as crossword puzzles, creative writing, and math proof path selection. Using a crossword puzzle as an example: each blank node can be filled with multiple candidate words, the LLM evaluates the reasonableness of each candidate and its match with existing answers, and BFS retains the best candidate paths for continued exploration.

Cost of ToT: Each reasoning step requires multiple LLM calls (each node needs evaluation), making computational cost significantly higher than CoT. Therefore, it's only worth using when the problem complexity is high enough that simple CoT can't solve it.

---

## Agent Development Frameworks

### AutoGen (Microsoft)

A collaboration framework based on multi-agent dialogue, using a **conversation and message-driven** collaboration approach. The core interaction between agents is message passing — one agent sends a message, other agents receive and respond, and messages flow between agents driving task progress.

**Core components**:

- `AssistantAgent`: An assistant agent wrapping the LLM, responsible for generating responses and planning tasks
- `UserProxyAgent`: A proxy agent representing the human user, capable of executing code and calling tools, feeding execution results back into the conversation
- `RoundRobinGroupChat`: Round-robin group chat mechanism, allowing each agent to speak in a fixed order
- `TextMentionTermination("TERMINATE")`: Automatically ends when the keyword TERMINATE appears in the conversation

**Practical case**: Building a Bitcoin price web application with Streamlit. The role chain is Product Manager (define requirements) → Engineer (write Streamlit code) → Code Reviewer (review code quality) → User Proxy (actually execute code and verify results). Each agent focuses on its own role responsibilities, iterating and improving through group chat conversations.

### AgentScope

A message-driven multi-agent platform that emphasizes an engineering-first design philosophy: composable architecture + message-driven, suitable for production-grade multi-agent system construction.

**Core components**:

- `Msg`: Unified message format, all inter-agent communication is encapsulated as standardized message objects
- `MsgHub`: Message routing hub, supporting message broadcast, multicast, and private channels
- `AgentBase`: Agent base class, core method is `reply()`, subclasses define their own response logic by overriding this method

**Practical case**: Three Kingdoms Werewolf game. Wolf team establishes a private channel through MsgHub at night (only wolf agents can communicate); uses Pydantic structured output to constrain agent behavior (ensuring each agent outputs stable formats when voting and speaking); includes fault tolerance mechanisms (a single agent exception doesn't interrupt the entire game flow, with MsgHub managing message distribution for exceptional agents).

### CAMEL

Design philosophy is "light architecture, heavy prompting" — by cleverly designing prompts (role division + Inception Prompting), enabling simple dual-agent structures to complete complex tasks without complex engineering frameworks.

**Core pattern**:

- **AI User**: The role that makes requests, issuing task instructions to the AI Assistant
- **AI Assistant**: The role that produces output, completing tasks and returning results
- **Inception Prompting**: Injecting detailed role settings into prompts for each role (who you are, what skills you have, how you collaborate), allowing agents to autonomously negotiate task division within their role framework

**Termination flag**: `<CAMEL_TASK_DONE>`, output by the AI Assistant when it considers the task complete.

**Practical case**: A "Psychologist" and "Writer" dual-role collaboration creating a popular science ebook about procrastination. The AI User (role: psychologist) defines each chapter's theme and core arguments, the AI Assistant (role: science writer) writes the chapter content, gradually completing the book through multiple rounds of dialogue.

### LangGraph

Models agent execution flow as a directed graph / state machine. Natively supports loops (ReAct's thought-action-observation loop), conditional branching (taking different paths based on evaluation results), fallback (falling back to the previous step on failure), and Reflection (self-loops implementing self-evaluation and improvement).

**Three elements**:

1. **State**: Defined using `TypedDict`, a shared state that all Nodes read and write
2. **Node**: Functions that receive the current State and return partial updates to it
3. **Edge**: Normal edges (fixed paths) and conditional edges (dynamically deciding the next step based on State content)

**Practical case**: A three-step Q&A assistant. `Understand` (understand question intent) → `Search` (call Tavily search engine to retrieve information) → `Answer` (integrate information to generate a response). If any step fails, fall back along a conditional edge to the previous step (e.g., if Search fails, return to the Understand stage to re-analyze the question).

### Emergent Collaboration vs. Explicit Control

| Dimension | Emergent (AutoGen / CAMEL) | Explicit Control (LangGraph) |
| --- | --- | --- |
| Control | Decentralized, agents negotiate autonomously | Centralized, developer predefines the flow |
| Flexibility | High, adapts to dynamic changes | Low, relatively fixed flow |
| Reliability | Low, prone to topic drift or dead loops | High, executes strictly according to the flow |
| Auditability | Poor, behavior paths are unpredictable | Good, execution paths are fully traceable |
| Applicable scenarios | Divergent (creative writing, code generation) | Convergent (enterprise automation, insurance underwriting) |

The two schools are not mutually exclusive. Real systems often mix both: LangGraph defines the stable outer flow, while AutoGen or CAMEL manages divergent sub-tasks within.

---

## Memory and Retrieval

### Two Major Pain Points

**LLMs are stateless**: Each API call is an independent computation; the model does not automatically "remember" previous conversation content. This causes four problems — context loss (important information is forgotten in multi-turn conversations), lack of personalization (the model can't remember user preferences), limited learning ability (the agent can't accumulate experience across interactions), and consistency issues (subsequent requests from the same user are treated as completely new conversations).

**Limited model knowledge**: Training data has a cutoff date; the model doesn't know about events that occurred after that date. Training data is primarily general internet text, with insufficient coverage of specialized domain knowledge. When uncertain, models tend to "make things up" rather than "admit not knowing" (hallucination).

### Memory System Architecture

```
HelloAgents Memory System
├── Infrastructure Layer
│   ├── MemoryManager (unified scheduling entry point)
│   ├── MemoryItem (generic memory data unit)
│   ├── MemoryConfig (independent config per memory type)
│   └── BaseMemory (abstract base class for memory types)
├── Memory Type Layer
│   ├── WorkingMemory
│   ├── EpisodicMemory
│   ├── SemanticMemory
│   └── PerceptualMemory
├── Storage Backend Layer
│   ├── QdrantVectorStore (vector database, high-performance semantic retrieval)
│   ├── Neo4jGraphStore (graph database, knowledge graph relationship management)
│   └── SQLiteDocumentStore (structured persistent storage)
└── Embedding Service Layer
    ├── DashScopeEmbedding (cloud API)
    ├── LocalTransformerEmbedding (offline deployment)
    └── TFIDFEmbedding (lightweight fallback solution)
```

#### Embedding Model Selection

Embedding models are responsible for converting text into vectors, forming the foundation of all semantic retrieval in a memory system. When selecting an embedding model, consider the following dimensions:

| Dimension | Options | Trade-offs |
| --- | --- | --- |
| Deployment | Cloud API vs. local deployment | Cloud is convenient but incurs additional cost and latency; local is private but requires GPU resources |
| Vector dimension | 384d (MiniLM) vs. 768d (BGE) vs. 1536d (OpenAI) | Higher dimensions offer stronger expressiveness but higher storage and retrieval costs |
| Language coverage | General English vs. Multilingual vs. Chinese-specific | For Chinese scenarios, BAAI/bge-large-zh-v1.5 outperforms general English models |
| Retrieval accuracy | MTEB benchmark scores | BEIR / MTEB leaderboards can serve as reference |
| Input length | 512 tokens vs. 8192 tokens | Short models suit sentence-level retrieval, long models suit paragraph-level retrieval |

The project implements three embedding schemes in a degradation chain: DashScopeEmbedding (Alibaba Cloud Tongyi Qianwen's cloud API, highest accuracy) → LocalTransformerEmbedding (runs locally using the Sentence-Transformers library, requires GPU) → TFIDFEmbedding (zero-dependency fallback based on TF-IDF, lowest accuracy but no external dependencies or GPU needed). Automatically degrades to LocalTransformer when DashScope is unavailable, then further to TFIDF.

#### Vector Database Selection

The project defaults to using Qdrant. When choosing a vector database for production, refer to the following comparison:

| Dimension | Chroma | Qdrant | Milvus |
| --- | --- | --- | --- |
| Architecture type | Embedded (single process) | Standalone service / cloud deployment | Distributed cluster |
| Deployment complexity | Low (pip install) | Medium (Docker single node) | High (K8s + etcd + MinIO) |
| Scale suitability | < 100K entries | 100K – 10M entries | > 1M entries |
| Query latency | 5–20ms | 1–5ms | 2–10ms |
| Hybrid search | Basic | strongest complex filtering | Comprehensive |
| Operational cost | Zero config | Medium | High |

Selection recommendations: Use Chroma for quick RAG validation during prototyping; Qdrant for medium-scale (100K–1M entries) production environments; Milvus cluster for large-scale (multi-million+) high-concurrency scenarios.

### Four Memory Types

| Type | Analogy | Storage Method | Retrieval Focus | Typical Scenarios |
| --- | --- | --- | --- | --- |
| **Working Memory** | Sticky note / short-term memory | In-memory only, TTL management, capacity limited | Fast access, time decay, hybrid retrieval | Current session context, information just mentioned by user |
| **Episodic Memory** | Diary | SQLite + Qdrant | Semantic similarity + temporal recency + session filtering | Past events, learned knowledge, actions taken |
| **Semantic Memory** | Knowledge encyclopedia | Qdrant + Neo4j | Vector semantics + graph relationship reasoning | Abstract concepts, relationships between concepts, long-term user preferences |
| **Perceptual Memory** | Sensory input cache | Modality-specific vector collections | Same-modality or cross-modal retrieval | Temporary storage and matching of visual features, audio characteristics |

### Scoring Mechanism

Different memory types have different retrieval scoring formulas, each highlighting its specialized direction:

**Episodic Memory**: `score = (vector_similarity × 0.8 + temporal_recency × 0.2) × (0.8 + importance × 0.4)`

- Vector similarity has high weight: because episodic memory's core is recalling "similar events"
- Temporal recency has lower but non-negligible weight: newer events typically have higher reference value
- importance parameter adjustment: importance score (0–1), can be manually specified or automatically inferred by the system

**Semantic Memory**: `score = (vector_similarity × 0.7 + graph_similarity × 0.3) × (0.8 + importance × 0.4)`

- Vector similarity still dominates but at a slightly lower ratio: because semantics rely on more than just vector matching
- Graph similarity weight of 0.3: measures conceptual relatedness through knowledge graph relationships in Neo4j (e.g., A "belongs to" B, C "influences" D)
- If Neo4j is unavailable (graph database not configured), graph similarity falls back to 0, and the score degrades to `vector_similarity × (0.8 + importance × 0.4)`

**Working Memory**: `final_score = base_relevance × time_decay × (0.8 + importance × 0.4)`

- Time decay function: recently written working memory scores higher than older entries (scores approach 0 as TTL nears expiration)
- Working memory doesn't rely on vector retrieval because its capacity has an upper limit (default N entries), directly linearly traversable

### MemoryTool Core Operations

The memory system exposes a unified interface through MemoryTool, supporting the following operations:

- **add**: Add a memory entry, specifying type (working / episodic / semantic / perceptual) and importance score (0–1)
- **search**: Search memories, supporting filtering by type (search one or more memory types) and by minimum importance threshold
- **forget**: Forget, supporting importance-based strategy (forget lowest-importance entries), time-based strategy (forget oldest entries), and capacity-based strategy (automatically clean up least important entries when count exceeds the limit)
- **consolidate**: Consolidate, extracting important information from short-term memory and converting it to long-term memory. The consolidation algorithm flow: filter entries from WorkingMemory with importance above threshold (default 0.6) → semantically match entry content against existing SemanticMemory (determine if there's an existing entry with similarity above 0.85) → merge matched entries (increment reference count and update timestamp), create new SemanticMemory entries for unmatched ones → remove consolidated entries from WorkingMemory. Consolidation can be triggered manually or automatically on a fixed schedule (e.g., every 10 interaction rounds).
- **summary / stats / update / remove / clear_all**: Other management operations

### RAG System

#### Document Processing and Chunk Strategies

Documents in any format (PDF, Word, Markdown, HTML, etc.) → MarkItDown tool converts to Markdown format → Parse heading hierarchy (build document structure tree) → Paragraph-level semantic segmentation (use natural paragraphs as units to maintain semantic integrity) → Token length control with Chunk Overlap → Embedding vectorization → Write to vector database (namespace isolation for different document sets).

Chunk strategy selection directly affects RAG retrieval quality. Four mainstream strategies:

| Strategy | Description | Recall | Applicable Scenarios |
| --- | --- | --- | --- |
| **Fixed-size chunking** | Split by fixed token count (e.g., 512 tokens), simple and crude | ~67% | Rough prototyping, unclear document structure |
| **Structure-based chunking** | Split using HTML/Markdown heading hierarchy | ~74% | Documents with clear heading structure |
| **Recursive chunking** | Iteratively split by delimiter hierarchy (paragraph→sentence→word) | ~80% | General purpose, balances granularity and semantics |
| **Semantic chunking** | Detect semantic boundaries using embedding similarity, split at semantic transitions | ~91% | High-quality requirements, knowledge-base-type systems |

**Parent-Child Chunk pattern**: Small chunks (~300 tokens) handle retrieval, large chunks (~1200 tokens) handle generation. When retrieving, small chunks are matched, but the corresponding parent paragraph is placed in the LLM context. Small chunks improve retrieval precision, large chunks ensure complete context for generation.

#### Search Result Re-ranking

In the first round of vector search results (Top-30 to Top-100), the top-ranked results aren't necessarily the most relevant. The purpose of re-ranking: use a more precise model to perform a secondary sort on the initial results.

**Three re-ranking methods**:

- **Cross-Encoder Reranker**: Concatenate the query with each candidate document and pass through a specialized ranking model (e.g., BGE-Reranker, Cohere Rerank), outputting a relevance score. More accurate than vector search (Bi-Encoder), but requires per-pair computation with higher latency.
- **LLM Rerank**: Use an LLM to rank candidate documents. Highly interpretable (the LLM can give reasons for ranking), but computationally most expensive.
- **Rule-based re-ranking**: Sort by metadata rules such as temporal recency, source authority, permission levels, etc., without relying on a model.

**Recommended retrieval pipeline**: Metadata pre-filtering → Multi-path recall (vector + keyword, coarse recall 30–100 results) → Deduplication and merging → Cross-Encoder Rerank to select 5–10 results → Context compression → Feed to LLM.

#### Advanced Retrieval Strategies

**MQE (Multi-Query Expansion)**:

Use an LLM to expand the user's original question into multiple semantically equivalent sub-questions (e.g., "What is RAG" expands to "What is the definition of RAG," "How does retrieval-augmented generation work," "What's the difference between RAG and fine-tuning"), each sub-question independently performs vector retrieval, merge all retrieval results and deduplicate before returning. MQE improves recall for vague questions — with multiple expressions of the same question, at least one matches the relevant text in the document.

**HyDE (Hypothetical Document Embeddings)**:

First have the LLM generate a "hypothetical answer" based on the user's question (doesn't need to be very accurate, just close in vocabulary and style to the target document), then use this hypothetical answer's embedding vector to retrieve the target document. HyDE exploits the "text form similarity" in embedding space — questions and documents are often written differently (questions are short and conversational, documents are long and professional), but the hypothetical answer and actual documents are closer at the word level. Suitable for scenarios where the user's questioning style differs significantly from the writing in the knowledge base.

### Relationship Between Memory and RAG

RAG handles finding knowledge, Memory handles recording history. RAG answers the current question (retrieving factual information from external knowledge bases), Memory supports long-term personalization (remembering user preferences, behavior patterns, and historical interactions). RAG's knowledge sources can be independently updated (just replace the knowledge base), Memory's content accumulates with each interaction (each interaction incrementally writes).

Typical collaboration patterns:

- When loading new materials: RAG stores documents + Memory records the event of "what materials the user loaded"
- When asking and answering: RAG retrieves documents to generate answers + Memory records the learning trajectory of questions and obtained answers
- When reviewing and studying: Memory reviews historical questions and notes + RAG supplements knowledge details
- When making plans: RAG provides domain knowledge + Memory provides user progress and preferences

---

## Context Engineering

### System Prompt Design Principles

The system prompt is the highest-priority fixed part of the context, and its design quality directly affects the agent's behavioral boundaries and ability to handle complex scenarios. The following points need attention in practice:

- **Clear role positioning**: Define the agent's identity, scope of tasks, and constraints. For example, "You are a code review assistant focused on Python backend code." Role definitions help the model reason within task boundaries, reducing "out-of-bounds" behavior.
- **Standardized tool descriptions**: Each tool's name, function, parameters, applicable scenarios, and inapplicable scenarios need to be clearly defined in the system prompt. The quality of tool descriptions determines whether the agent can select the right tool in the right scenario.
- **Behavioral constraints before functional descriptions**: First say "what is forbidden" then "what can be done." Safety constraints (e.g., "Do not execute the `rm` command") should come before functional descriptions, with higher priority.
- **Dynamic injection vs. static hardening**: Fixed information (role, rules, safety constraints) is written in the system prompt and remains unchanged long-term; runtime information (task descriptions, tool lists) is dynamically assembled by the ContextBuilder. Don't hardcode dynamic information in the system prompt.
- **Keep it concise**: Longer system prompts aren't necessarily better. A system prompt that exceeds necessary length will be treated equally by the model as "context that needs attention," diluting attention to actual task information. Core rules should be covered within 500 tokens.

### Context Engineering vs. Prompt Engineering

Prompt engineering focuses on "how to write a good prompt," with its core question being single-round or short-task instruction optimization. Context engineering focuses on a broader question: **before each model call, what information should be provided, in what structure, and within what budget?** Considerations include system prompts (fixed identity and behavioral rules), tool descriptions (tool schemas and usage instructions), conversation history (past interaction records), memories (relevant fragments retrieved from long-term memory), RAG results (information retrieved from external knowledge bases), NoteTool output (structured notes), TerminalTool output (file system exploration results), and agent state (planning progress and unfinished tasks).

### Context Rot

As the number of tokens in the context window increases, the model's ability to accurately recall and use key information decreases. Three reasons:

1. **Attention is spread thin**: Transformer's self-attention needs to compute associations between all pairs of tokens. The more tokens, the more dispersed the attention weights on each token, diluting key information.
2. **Increased noise**: Irrelevant history, repeated tool outputs, and stale intermediate plans occupy valid context space, making it hard for the model to grasp truly important information.
3. **Training distribution limitations**: The vast majority of text the model encountered during pre-training was within a few thousand tokens, providing insufficient experience with information extraction from very long sequences.

### The GSSC Pipeline

The ContextBuilder's core framework consists of four stages:

#### Stage 1: Gather

Collect candidate information from multiple sources, including:

- **System instructions**: Highest priority, typically fixed
- **MemoryTool**: Relevant memory entries retrieved from long-term memory
- **RAGTool**: Knowledge fragments retrieved from external knowledge bases
- **Conversation history**: Only keep the most recent N entries (default N=20, configurable)
- **Custom information packages**: NoteTool's structured notes, TerminalTool output, etc.

#### Stage 2: Select

Use a weighted scoring mechanism to filter candidate information:

```
combined_score = relevance_weight × relevance_score + recency_weight × recency_score
```

Flow: Separate system instructions (always retain) → Calculate a combined score for each candidate → Filter out information below the `min_relevance` threshold → Sort by combined score → Greedy fill (add one by one from high score to low, until the token limit is reached).

Information exceeding the limit is not discarded but retained for the next round. The next Gather round will still consider them, and the decaying recency_score may cause them to be selected again.

#### Stage 3: Structure

Organize selected information into a structured template:

```
[Role & Policies]  ← System instructions (identity and rules)
[Task]             ← Current task description
[Evidence]         ← RAG results, memory fragments
[Context]          ← Conversation history summary or recent records
[Output]           ← Output format requirements and examples
```

The significance of a fixed template: having the model see contextual information in the same position each time, so the model learns to find specific types of information from fixed positions. If the information arrangement differs every time, the model needs to spend extra attention locating information during reasoning.

#### Stage 4: Compress

When all candidate information, even after selection, still exceeds the context window, perform fallback compression on the constructed but over-limit context. Compression rules: prioritize compressing highly redundant information (e.g., keep only one of multiple similar document fragments), then compress older, lower-scoring information, and finally compress auxiliary information (e.g., tool usage examples). Retention priority: key decisions > unresolved problems > constraints > next actions > background information.

### NoteTool (Structured Notes)

Structured external memory for long-duration tasks. The agent can actively write notes during execution, with note content persisted to local files and retrieved and loaded by the ContextBuilder in subsequent interactions.

Format is Markdown + YAML frontmatter. Classification system:

- **blocker**: Current blocking points or obstacles (e.g., "Module xxx requires library xxx, but it's not installed in the current environment")
- **action**: Executed or pending operations (e.g., "Modified file xxx, pending verification")
- **task_state**: Task progress status (e.g., "Phase 1 80% complete, remaining xxx sub-tasks")
- **conclusion**: Conclusions reached (e.g., "Determined the frontend-backend separation plan for this project")
- **reference**: Reference information (e.g., "Documentation link for xxx API," "Path to xxx config file")
- **scratch**: Temporary drafts and intermediate results

### TerminalTool (Just-in-Time Filesystem Access)

Implements JIT (Just-in-Time) context — exploring the filesystem only when needed, rather than pre-loading all file content into context.

Security mechanisms:

- **Command whitelist**: Only allows specified commands (e.g., `ls`, `cat`, `find`, `grep`), prohibits dangerous commands like `rm`, `sudo`
- **Working directory sandbox**: Commands can only execute within a specified root directory, prohibits `..` traversal
- **Timeout control**: Commands are automatically terminated when exceeding a specified time limit
- **Output size limit**: Output content exceeding a specified token count is automatically truncated

Applicable scenarios: Log analysis (on-demand search for specific patterns), codebase exploration (find files, search for definitions), data file analysis (preview file structure).

### Three Strategies for Long-Duration Tasks

| Strategy | Problem Solved | Typical Approach | Applicable Scenarios |
| --- | --- | --- | --- |
| **Compaction** | Conversation history too long, window near limit | Use LLM to summarize history with high fidelity, then restart context | Long continuous conversations, ongoing research |
| **Structured Note-taking** | Key state needs persistent saving across windows | Write conclusions/blockers/plans to NoteTool | Multi-day project maintenance, complex plans |
| **Sub-agent** | Single context can't accommodate multi-direction parallel exploration | Main agent plans, sub-agents independently explore and return summaries | Large codebase analysis, multi-faceted troubleshooting |

### Context Engineering System Layers

Context management isn't a problem solvable by a single tool; it requires coordination across multiple abstraction layers: **TerminalTool** works at the "instant access layer" (on-demand loading per round) → **MemoryTool** works at the "session memory layer" (within-session to cross-session) → **NoteTool** works at the "persistent notes layer" (cross-day, cross-session) → **ContextBuilder** works at the "context orchestration layer" (information aggregation before each model call).

### Practical Principles

- More context isn't necessarily better — relevance, freshness, and structure matter more
- System prompts should be stable, but don't cram complex business processes entirely into the prompt
- Tool sets should be small and clear, with single responsibilities and clear boundaries
- Long-duration tasks must have an external state layer, not relying solely on conversation history
- JIT context (TerminalTool) suits dynamic information, RAG suits stable, semantic, reusable knowledge
- Compression should retain decisions, constraints, unresolved issues, and next steps
- Notes must be regularly consolidated (consolidate), otherwise they become "external noise" instead of "external memory"
- High-risk tool calls must have safety boundaries and human approval

---

## Agent Skills

The Agent Skills specification, proposed by Anthropic, defines how to package capabilities so they can be discovered and used by agents.

### Progressive Disclosure

Skill information is divided into three layers, avoiding dumping everything into the context window at once:

1. **Metadata layer**: ~100 tokens per skill, containing the skill name, one-line description, and key tags. When the agent needs to select a skill, loading only the metadata layer suffices for preliminary filtering.
2. **Skill body**: The core information — what it can do, what tools it needs, input and output formats. Loaded when the agent confirms it will use a specific skill.
3. **Additional resources**: Example code, FAQ, detailed documentation. Loaded only when the agent needs in-depth study or encounters difficulties during runtime.

This design allows agents to be aware of multiple available capabilities within limited context space, only diving into the details of a specific skill when needed.

### SKILL.md Specification

The description file for each skill defines the following key fields: name (skill name), description (what the skill does), version (version number), allowed_tools (list of tools the skill is allowed to use), workflow (workflow description), best_practices (best practices and usage notes).

### Relationship Between Agent Skills and MCP

MCP solves the "connectivity" problem — enabling agents to access external tools and data. Agent Skills solves the "capability" problem — telling agents how to correctly use these tools to achieve a goal. MCP defines the underlying communication protocol (how to transmit tool calls and returns), Agent Skills defines the upper-level usage method (which tools should be called in which scenarios and in what order).

---

## Agent Communication Protocols

### MCP (Model Context Protocol)

An open protocol proposed by Anthropic, aiming to standardize the way LLM applications interact with external tools and data sources. MCP solves the **connectivity problem** — enabling agents to access external tools and data.

**Three-layer architecture**:

- **Host layer**: LLM applications that need to interact with external systems, such as Claude Desktop, IDE plugins
- **Client layer**: Components within the Host that establish connections with MCP Servers, responsible for managing connection lifecycles
- **Server layer**: Lightweight services exposing specific capabilities, each Server responsible for one functional domain (filesystem, database, external API)

**Three core capabilities**:

- **Tools**: Actively invocable functions, such as search, calculation, API requests. Require Host authorization to execute.
- **Resources**: Data sources that can be read, such as file contents, database records, API results. Similar to REST API GET requests. Resources support two retrieval methods: **direct reading** (Host requests resource content by URI, fetching complete data in one call) and **subscription mode** (Host subscribes to resource change notifications from the Server; when resource content changes, the Server actively pushes updates without Host polling). Resources also support **Resource Templates** — using URI templates (e.g., `file://{path}`) to define patterns for a class of resources, with the Host filling in template parameters at runtime to obtain specific resources.
- **Prompts**: Predefined prompt templates that guide the LLM on how to interact with specific resources or tools.

**Transport methods**:

- **stdio**: MCP Server and Host in the same process, communicating through standard input/output, suitable for embedded and local deployment
- **SSE (Server-Sent Events)**: HTTP long connection, Host and Server separated, suitable for remote deployment
- **Streamable HTTP**: Streaming HTTP transport scheme introduced by Anthropic. Improvements over SSE: unified connection lifecycle management (supports automatic switching between long connections and on-demand short connections), built-in heartbeat and reconnection mechanism (automatic recovery after client disconnection), supports bidirectional streaming (Server can push updates to Host, Host can actively send requests to Server). Establishes connections only when needed, automatically closes when idle.

**Relationship with Function Calling**: Complementary, not competitive. Function Calling is an LLM model capability — identifying the intent to call a tool from the model output and generating structured parameters. MCP is an infrastructure protocol — unifying the registration, discovery, and invocation of tools. Function Calling decides "whether to call a tool," MCP decides "how to find and call a tool."

### A2A (Agent-to-Agent Protocol)

A peer-to-peer agent collaboration protocol proposed by Google, solving interoperability between different agent systems. Each agent is both a service provider and a service consumer.

**Core components**:

- **Agent Card**: An agent's capability declaration file in JSON format, describing the agent's identity, supported skills, and interface endpoints. Example:

```json
{
  "name": "research-assistant",
  "description": "Deep research agent for academic papers",
  "skills": ["paper_search", "summary_generation", "citation_analysis"],
  "endpoints": {
    "base_url": "http://localhost:8080",
    "tasks": "/tasks",
    "stream": "/tasks/stream"
  },
  "auth": { "type": "api_key", "header": "X-API-Key" }
}
```
- **Task**: Lifecycle management of tasks, including submission, status tracking, and cancellation
- **Message**: Communication message entities between agents
- **Part**: Content units within a message, can be a piece of text, a file reference, or a structured data block

A2A's advantages: avoids the bottleneck of centralized coordinators (removes single points of failure and performance bottlenecks), natively supports streaming and event-driven communication (agents can push progress in real-time rather than polling).

### ANP (Agent Network Protocol)

A conceptual protocol framework proposed by the open-source community, positioned for decentralized service discovery in large-scale agent networks. Similar to service registries (Consul / Etcd) in microservice architectures, but agents can actively declare and revoke their capability registrations, with other agents discovering available services by querying the network.

ANP's ecosystem is not yet mature at the current stage and is covered in the course as a conceptual introduction.

### Protocol Positioning Comparison

The three protocols operate at different layers in the agent ecosystem:

- MCP handles "accessing external capabilities" (LLM ↔ tools / data sources), solving the vertical integration problem
- A2A handles "multi-agent orchestration" (Agent ↔ Agent), solving the horizontal collaboration problem
- ANP handles "large-scale service discovery" (Agent ↔ Network), solving the organizational management problem

The three can coexist and complement each other. In a typical multi-agent system: ANP helps agents discover other agents and capabilities → A2A enables peer-to-peer communication and collaboration after discovery → MCP allows each agent to access its own tools and data.

---

## Agentic-RL

### From LLM Training to Agentic RL

The core idea is to treat the LLM as a learnable policy embedded in the agent's perception-decision-execution loop, optimizing multi-step task performance through reinforcement learning. Traditional agent construction relies on prompt engineering — the agent's behavior is entirely fixed by system prompts and cannot be optimized for specific task environments. Agentic RL allows the agent to learn optimal behavior strategies through reward signals from interacting with the environment.

Key differences between Agentic RL and traditional PBRFT (i.e., RLHF / PPO for text preference optimization):

| Dimension | Traditional PBRFT | Agentic RL |
| --- | --- | --- |
| State space | Static prompt + single-turn response | Dynamic context evolving through multi-turn interactions |
| Action space | Text generation only | Text generation + tool call parameter generation + environment operations |
| Reward design | Human preference score (single output quality) | Cumulative task completion reward (multi-step sequence decision quality) |
| Time horizon | T=1 (single step) | T≫1 (multi-step sequence) |

### GSM8K Dataset

GSM8K is a dataset of elementary school math word problems, containing 7,473 training samples and 1,319 test samples. The problems involve addition, subtraction, multiplication, division, ratios, unit conversion, and other basic math operations, mostly requiring two or more steps of reasoning.

Usage in the course:

- **SFT format**: Provides complete problem statements and step-by-step solution processes as supervised signals
- **RL format**: Provides only the problem text and the final correct answer (just a number), without the solution process

The design intent of the RL format: to force the model to discover the correct reasoning path through its own exploration, rather than imitating ready-made solution processes. This better reflects the "goal without path" problems agents face in real environments.

### Reward Functions

Three reward function designs, each with different optimization objectives:

- **AccuracyReward**: +1 when the answer is correct, 0 when wrong. This is the most direct reward signal, but only focuses on the correctness of the final result, not the quality of the reasoning process.
- **LengthPenaltyReward**: **Only when the answer is correct**, penalizes overly long responses. Addresses the problem of agents being "redundant to be safe" — if one agent uses 500 tokens of reasoning to reach a correct answer and another uses only 100 tokens, the latter receives a higher reward.
- **StepReward**: Rewards clear reasoning steps. Encourages the model to decompose the reasoning process into distinct logical steps rather than one long block. The clearer the steps and the more reasonable each step's reasoning, the higher the reward.

In practice, the three reward functions are usually combined with weights: `total_reward = w1 × AccuracyReward + w2 × LengthPenaltyReward + w3 × StepReward`.

### SFT Supervised Fine-Tuning

The goal of the SFT stage is to "teach the model how to answer" — output format, reasoning patterns, tool usage norms. Uses LoRA for parameter-efficient fine-tuning (Qwen3-0.6B + LoRA requires only about 4GB of VRAM).

SFT's role:

- Establishes baseline behavior: the model learns to generate "reasonably-looking" reasoning trajectories for each problem
- Learns output format: the model learns to embed reasoning steps, tool calls, and final answer structure within text
- Avoids the inefficiency of random exploration during early RL training: with an SFT baseline, RL can optimize on top of "basically functional" rather than exploring from scratch

### GRPO (Group Relative Policy Optimization)

Compared to traditional PPO, GRPO's core innovation is using **within-group relative rewards** to replace PPO's advantage function — it doesn't need to train a separate Value Model (a neural network for estimating state values), simplifying the training process.

**Training flow**:

1. For the same input problem, the current policy model generates N different answers (a "group," N is typically 4–8)
2. Use the reward function to compute a reward score for each answer
3. Compute the average reward within the group
4. For each answer, compute "relative advantage" = this answer's reward - group average reward
5. Use the relative advantage as a signal to update the policy model — generation paths with positive relative advantage are strengthened, those with negative relative advantage are suppressed

GRPO's design intuition: doesn't need an absolute value judgment ("how many points does this answer deserve"), only needs relative comparison ("is this answer better or worse within this group"). Relative comparison is insensitive to the scale of the reward function, making training more stable.

### Technology Stack

| Layer | Components |
| --- | --- |
| Dataset layer | GSM8KDataset, `create_sft_dataset()`, `create_rl_dataset()` |
| Reward function layer | AccuracyReward, LengthPenaltyReward, StepReward |
| Trainer layer | SFTTrainerWrapper, GRPOTrainerWrapper |
| Unified interface layer | RLTrainingTool |

The technology selection is HuggingFace TRL (Transformer Reinforcement Learning, HuggingFace's official reinforcement learning training tool library) + Qwen3-0.6B model.

### Quick Start

```python
from hello_agents.tools import RLTrainingTool

rl_tool = RLTrainingTool()

# SFT training
rl_tool.run({
    "action": "train",
    "algorithm": "sft",
    "model_name": "Qwen/Qwen3-0.6B",
    "output_dir": "./models/quick_sft",
    "use_lora": True
})

# GRPO training
rl_tool.run({
    "action": "train",
    "algorithm": "grpo",
    "model_name": "Qwen/Qwen3-0.6B",
    "output_dir": "./models/quick_grpo",
    "num_generations": 4,   # Generate 4 answers per question
    "use_lora": True
})
```

---

## Performance Evaluation

### Evaluation Goals

Four goals for agent evaluation:

1. **Quantify performance**: Know what level the system has reached — is it "production-ready" or "demo-only"
2. **Compare approaches**: Make objective choices between different agent approaches, different models, different prompt versions
3. **Discover weaknesses**: Identify system bottlenecks and directions for improvement — is it incorrect tool call selection? inaccurate memory retrieval? or insufficient reasoning ability?
4. **Prove reliability**: Before releasing to production, ensure the system behaves correctly across various scenarios

### BFCL (Berkeley Function Calling Leaderboard)

A benchmark proposed by UC Berkeley for evaluating agent tool-calling ability. Uses **AST matching algorithms** to evaluate whether function calls exactly match expected calls (including function name, parameter names, parameter types, nested structure).

**Four evaluation categories**:

- **Simple**: Single function call, direct parameter matching
- **Multiple**: Requires sequentially calling multiple independent functions, where the output of one call may be the input of the next
- **Parallel**: Multiple function calls with no dependencies, can be executed in parallel, requires the model to produce multiple tool calls in a single response
- **Irrelevance**: Tests the model's ability to judge "when no tool call is needed" — some questions can be answered without calling any tools; the model is penalized for excessive tool calls

**Three usage methods**:

1. **BFCLEvaluationTool** (recommended): Complete evaluation with one line of code
2. **One-click evaluation script**: `04_run_bfcl_evaluation.py --category simple --samples 10`
3. **Direct use of Dataset + Evaluator**: Custom evaluation pipeline, suitable for scenarios requiring modified evaluation logic

### GAIA (General AI Assistants)

A comprehensive capability evaluation benchmark for general AI assistants, containing 466 tasks. GAIA's design philosophy: a good AI assistant should excel at completing end-to-end tasks, not just answering factual questions. Tasks require the agent to autonomously plan, search, reason, and combine information from multiple sources.

**Four-level benchmark**:

| Level | Capability Requirements | Typical Tasks |
| --- | --- | --- |
| Foundation | Document parsing, simple reasoning | Extract key data from PDF and calculate |
| Advanced | Multi-modal interaction, resource integration | Analyze PPT content and generate emails, integrate online resources for research |
| Expert | Cross-domain knowledge transfer | Combine medical knowledge with legal document review |
| Challenge | Dynamic environment adaptation | Adjust strategies based on real-time data |

Data: Only about 8.7% of open-source agents pass all expert-level tests. Main bottlenecks include: insufficient long-context memory capability, cross-modal semantic alignment errors, and lack of exception handling strategies.

### Data Generation Quality Evaluation

For agent system outputs (such as generated reports, translations, summaries), in addition to objective metrics, quality evaluation is also needed. Main methods:

- **LLM-as-Judge**: Use another, stronger LLM as an evaluator to score agent outputs across multiple dimensions. Typical prompt template:

```
You are a strict reviewer. Please rate the following response on several dimensions (1-5 points):
1. Accuracy: Are all facts in the response well-supported?
2. Completeness: Does the response cover all aspects of the question?
3. Relevance: Is the content directly relevant to the question?
4. Readability: Is the response clear and well-structured?

Question: {question}
Agent's response: {answer}
Please output scores and reasons in JSON format.
```

- **Win Rate**: Compare the output of Agent A with Agent B (e.g., a baseline), calculating the percentage where human or LLM evaluators prefer A.

---

## Agent Security Risks

### Prompt Injection

Prompt injection is the most common agent security issue. Attackers embed malicious instructions in user input, causing the agent to ignore the original system prompt and execute the attacker's intent. Divided into direct injection (user input directly contains malicious instructions) and indirect injection (malicious instructions enter through external documents retrieved by the agent).

**Mitigation strategies**: Isolate user input from system instructions with clear boundary markers in the context; implement strict permission controls on tools the agent can execute; set up human confirmation steps for high-risk operations (file deletion, data modification, payments).

### Tool Abuse and Privilege Escalation

If limits are lacking on an agent's ability to call tools autonomously, this may lead to: tools being called to perform operations outside their designed scope (e.g., a search tool being used to build privacy profiles); agents exploiting privilege escalation to access data they shouldn't; tool call parameters exceeding the safety range (e.g., a file-reading tool being passed `../../../etc/passwd`).

**Mitigation strategies**: Define clear parameter range constraints for each tool; implement command whitelists, path sandboxes, and timeout controls in the tool executor; classify tool calls by risk level (low-risk auto-execute, medium-risk log, high-risk human approval).

### Data Leakage

During execution, agents may pass sensitive data (API keys, user privacy, internal documents) as part of context to external LLMs. On the other hand, agents may also expose data obtained from external tools to unauthorized users.

**Mitigation strategies**: Automatically detect and redact sensitive information in input context; post-process and filter agent outputs; isolate tool execution environments (TerminalTool's working directory sandbox).

### Output Safety

Agent outputs may contain fabricated information (hallucination), misleading content, or unverified assertions. When agents have tool-calling capabilities, the safety boundary of outputs is wider than pure-text LLMs — the agent might call a tool to perform an operation and then tell the user "it's done" when it actually wasn't (or did something different).

**Mitigation strategies**: Tool call execution results must be truthfully reported back to the user; provide operation confirmation steps for operations affecting external systems; use the Reflection paradigm to have the agent self-check before completing the full operation.

---
