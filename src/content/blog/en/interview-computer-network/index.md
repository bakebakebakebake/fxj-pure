---
title: "From Browser to Server: Which Network Layers a Request Crosses"
description: Don't reduce computer networks to a list of protocol names. Follow a real request and see how DNS, TCP, TLS, HTTP, and congestion control work together.
publishDate: 2025-03-21
tags:
  - Interview Prep
  - Computer Networks
  - HTTP
  - TCP
  - DNS
  - HTTPS
language: English
heroImageSrc: ../../../pic/miguel-angel-padrinan-alba-xvASUPTwJsI-unsplash.jpg
heroImageColor: " #7a7e7f "
---

`Request Perspective` `TCP / HTTP` `HTTPS`

Computer networks are easiest to learn as a "protocol name warehouse."

HTTP, HTTPS, TCP, UDP, DNS, IP, MAC, ARP, congestion control, flow control—they all sound important, and they can indeed be asked separately in exams. But once you keep them separated for too long, your brain starts forgetting one crucial fact: **these things were originally designed to make real communication happen**.

So I increasingly prefer to start learning computer networks from a single request.

First question: **When I type a URL in the browser, which layers are actually working together**.

> [!tip] Always review computer networks with a request in mind
> You can attach all knowledge points to this chain: "find address -> establish connection -> ensure security -> transmit semantics -> control speed -> close connection". As long as this chain stays intact, many interview questions won't fragment into a pile of terms.

## First, Walk Through a Complete Request

[timeline]

- Parse URL
  The browser first extracts the protocol, domain, port, and path, preparing the target to access.

- DNS Query
  Convert the domain name to an IP, with cache, recursive resolver, and authoritative DNS working in sequence.

- Establish Connection
  If using TCP, a handshake is required first; if it's HTTPS, TLS negotiation must also be completed on top.

- Send HTTP Request
  Request method, headers, path, and status semantics come into play.

- Transmission and Control
  Segmentation, acknowledgment, retransmission, flow control, and congestion control work together to ensure data is delivered as stably as possible.

- Response and Rendering
  The browser receives the response, then continues to fetch CSS, JS, and images before the page is fully displayed.

As long as you keep this timeline in mind, the responsibilities of each layer become much easier to understand.

## Step One: Find the Other Party First

Many people say "the browser sends a request," which sounds like the first step is sending HTTP.

Actually, it's not.

In most scenarios, the browser first needs to know: which machine does this domain name correspond to.

### What DNS Does Is Convert Names to Addresses

Domain names are easy to remember, but machines actually rely on IP addresses for routing.

So the core responsibility of the DNS layer is to translate:

- `www.example.com`

into:

- An IP address that can be routed to.

This step commonly goes through these caches or nodes:

- Browser cache;
- Operating system cache;
- Local recursive resolver;
- Root, top-level domain, and authoritative DNS servers.

You don't necessarily have to memorize the entire recursive process every time, but it's best to know: **DNS is not a single-point phone book; it's itself a layered collaborative system**.

### Why DNS Directly Affects Access Experience

Because it's a necessary step before the request truly begins.

- Slow resolution means slow time to first byte overall;
- Different resolution strategies may direct users to different data centers;
- CDN scheduling often relies primarily on domain name resolution results.

So when you say "the website is slow," the problem might not even have reached the business service yet—it's already slow at the resolution path.

> DNS decouples "human-friendly names" from "machine-routable addresses," while also enabling caching and traffic scheduling. This is much better than rote memorization.

## Step Two: Connection Isn't Just "Connected" and Done

After getting the IP, the request still hasn't truly started.

If using TCP-based communication, the client and server must first establish this channel.

### What the Three-Way Handshake Is Actually Confirming

Many people say "the three-way handshake is to confirm both sides can send and receive normally," which is correct but somewhat abstract.

A more complete understanding would be:

- The client first initiates the connection intention;
- The server confirms it can receive and is willing to send;
- The client then confirms it received the other party's response;
- Both sides also complete initial sequence number synchronization, laying the foundation for subsequent reliable transmission.

So the handshake is **establishing a common context for the subsequent reliable byte stream**.

### Complete TCP Three-Way Handshake Process

**First Handshake**:
- Client sends: SYN=1, seq=x
- State transition: CLOSED → SYN_SENT
- Meaning: Client requests connection establishment, initial sequence number is x

**Second Handshake**:
- Server sends: SYN=1, ACK=1, seq=y, ack=x+1
- State transition: LISTEN → SYN_RCVD
- Meaning: Server confirms receipt of request, simultaneously sends its own initial sequence number y

**Third Handshake**:
- Client sends: ACK=1, seq=x+1, ack=y+1
- State transition: SYN_SENT → ESTABLISHED (client), SYN_RCVD → ESTABLISHED (server)
- Meaning: Client confirms receipt of server response, connection establishment complete

**Why Three Handshakes Are Needed**:
- Two isn't enough: Server can't confirm the client can receive its response
- Four is too many: The second and third can be combined (server's ACK and SYN can be sent together)
- Prevent old connections: If the client's old SYN packet arrives delayed, the three-way handshake can identify and reject it

### Observing the Three-Way Handshake with tcpdump

```bash
# Capture TCP packets on local port 80
sudo tcpdump -i any port 80 -nn -S

# Example output:
# First handshake
# IP 192.168.1.100.54321 > 192.168.1.200.80: Flags [S], seq 1000, win 65535
# Second handshake
# IP 192.168.1.200.80 > 192.168.1.100.54321: Flags [S.], seq 2000, ack 1001, win 65535
# Third handshake
# IP 192.168.1.100.54321 > 192.168.1.200.80: Flags [.], ack 2001, win 65535
```

**Wireshark Analysis Tips**:
```
# Filter TCP handshake packets
tcp.flags.syn==1

# View complete flow of a specific connection
tcp.stream eq 0
```

### Why Closing a Connection Is Often More Confusing Than Establishing One

Because establishing a connection takes three steps, while closing a connection often involves four-way handshake, half-close, and `TIME_WAIT`.

The most important thing to understand here is:

- TCP is full-duplex;
- One side no longer sending doesn't mean the other side immediately has no data to send;
- So closing both sending directions often requires separate confirmation.

This is also why "four-way handshake" is usually more likely to be questioned in detail than "three-way handshake."

> [!note]- What TIME_WAIT Is Actually Doing
> It's not simply "wasting ports." Keeping a waiting period is mainly to let potentially delayed old packets completely dissipate, and to ensure that if the final acknowledgment packet is lost, there's still a chance to resend. Its existence is essentially closing out the connection lifecycle.

## Where TCP Is Really Powerful Is That It Makes "Reliability" a Complete Set of Mechanisms

"TCP is reliable, UDP is unreliable" is the most common summary, but this statement too easily flattens all the details.

TCP's reliability is built from several mechanisms working together:

- Sequence numbers;
- Acknowledgment responses;
- Timeout retransmission;
- Sliding window;
- Flow control;
- Congestion control;
- Out-of-order reassembly.

### Flow Control and Congestion Control Are Not the Same Thing

This is also a particularly common point of confusion in interviews.

- **Flow control** is more like the receiver saying: don't send too fast, I can't keep up;
- **Congestion control** is more like the network saying: don't overload the intermediate links.

One focuses on receiver processing capacity, the other on overall network load.

### TCP Flow Control Explained

**Sliding Window Mechanism**:
```
Sender window:
[Sent & Acked][Sent & Unacked][Can Send][Cannot Send]
              ↑              ↑
              Send window left edge  Send window right edge

Receiver window:
[Received & Acked][Can Receive][Cannot Receive]
                  ↑           ↑
                  Receive window left edge  Receive window right edge
```

**Dynamic Window Size Adjustment**:
- Receiver tells sender its receive window size via the Window field in TCP header
- Sender adjusts sending rate based on receive window
- When receive window is 0, sender stops sending (except window probe packets)

**Zero Window Problem**:
```
Receiver: Window=0 (buffer full)
    ↓
Sender: Stop sending, start persist timer
    ↓
Sender: Periodically send window probe packets (1 byte)
    ↓
Receiver: Window=1024 (buffer has space)
    ↓
Sender: Resume sending
```

### TCP Congestion Control Explained

TCP uses four algorithms to control congestion:

**1. Slow Start**:
```
Initial: cwnd = 1 MSS
For each ACK received: cwnd = cwnd * 2 (exponential growth)

cwnd changes: 1 → 2 → 4 → 8 → 16 → ...
Until reaching slow start threshold (ssthresh)
```

**2. Congestion Avoidance**:
```
When cwnd >= ssthresh:
For each ACK received: cwnd = cwnd + 1/cwnd (linear growth)

cwnd changes: 16 → 17 → 18 → 19 → ...
```

**3. Fast Retransmit**:
```
Sender receives 3 duplicate ACKs:
Immediately retransmit lost packet, don't wait for timeout

Normal: Send 1,2,3,4,5 → Receive ACK 1,2,3,4,5
Loss: Send 1,2,3,4,5 → Receive ACK 1,2,2,2,2 (3 duplicate ACKs)
      ↓
      Immediately retransmit packet 3
```

**4. Fast Recovery**:
```
After fast retransmit:
ssthresh = cwnd / 2
cwnd = ssthresh + 3
Enter congestion avoidance phase
```

**Congestion Control State Transitions**:
```
                Slow Start
                  ↓
            cwnd >= ssthresh
                  ↓
            Congestion Avoidance
                  ↓
            Detect packet loss (3 duplicate ACKs)
                  ↓
            Fast Retransmit
                  ↓
            Fast Recovery
                  ↓
            Back to Congestion Avoidance
```

**Timeout Retransmission Handling**:
```
Timeout occurs:
ssthresh = cwnd / 2
cwnd = 1
Re-enter slow start
```

### Practice: Using ss Command to View TCP State

```bash
# View TCP connection congestion window information
ss -tin

# Example output:
State    Recv-Q Send-Q Local Address:Port  Peer Address:Port
ESTAB    0      0      192.168.1.100:22    192.168.1.200:54321
         cubic wscale:7,7 rto:204 rtt:3.5/1.5 ato:40 mss:1448
         pmtu:1500 rcvmss:1448 advmss:1448
         cwnd:10 ssthresh:7 bytes_acked:12345 bytes_received:67890
         ↑       ↑
         Congestion window  Slow start threshold

# Parameter explanations:
# cubic: Congestion control algorithm
# rto: Retransmission timeout (ms)
# rtt: Round-trip time (ms)
# cwnd: Congestion window size
# ssthresh: Slow start threshold
```

### Comparison of Different Congestion Control Algorithms

Linux supports multiple congestion control algorithms:

**Reno (Classic Algorithm)**:
- Uses fast retransmit and fast recovery
- Halves cwnd on packet loss
- Suitable for low-latency networks

**Cubic (Linux Default)**:
- Window growth function is cubic
- More aggressive window growth
- Suitable for high-bandwidth long-delay networks

**BBR (Developed by Google)**:
- Based on bandwidth and RTT modeling
- Doesn't rely on packet loss as congestion signal
- Suitable for high packet loss networks

```bash
# View current congestion control algorithm
sysctl net.ipv4.tcp_congestion_control

# View available algorithms
sysctl net.ipv4.tcp_available_congestion_control

# Change congestion control algorithm
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
```

### Why TCP Is Suitable for General Application Layer Protocols

Because upper layer applications usually don't want to reinvent these mechanisms themselves.

HTTP, MySQL protocol, and most backend services focused on correctness prefer to speak directly on top of a reliable byte stream.

This is also why TCP has long been the mainstay in traditional internet applications.

## HTTPS: HTTP with a Layer of TLS

This statement is simple, but especially worth remembering.

Because it immediately clarifies the responsibilities:

- HTTP is responsible for expressing "what I want, what you give me";
- TLS is responsible for confidentiality, integrity, and identity authentication;
- TCP is responsible for preparing the underlying reliable transmission channel.

### What TLS Handshake Is Actually Doing

If we summarize in one plain sentence, it's:

- Negotiate algorithms;
- Verify server identity;
- Establish key material to be used for this session.

So HTTPS being a bit slower is commonly not just "encryption is more complex," but:

- TCP handshake comes first;
- TLS negotiation must also be done on top;
- Certificate validation, key exchange, and handshake round trips all bring additional cost.

But what you get in return is a security boundary that plain HTTP simply doesn't have.

### Complete TLS 1.2 Handshake Process

**1. ClientHello**:
- Client sends:
  - Supported TLS versions
  - List of supported cipher suites
  - Client random number (Client Random)
  - Supported compression methods

**2. ServerHello**:
- Server sends:
  - Selected TLS version
  - Selected cipher suite
  - Server random number (Server Random)
  - Server certificate (Certificate)
  - ServerHelloDone

**3. Client Verifies Certificate**:
- Check if certificate is signed by trusted CA
- Verify certificate chain integrity
- Check if certificate is expired
- Verify domain name matches

**4. Key Exchange (using ECDHE as example)**:
- Client generates pre-master secret
- Encrypts using server's public key
- Sends ClientKeyExchange message

**5. Generate Session Key**:
- Both sides use: Client Random + Server Random + Pre-Master Secret
- Generate session key through PRF (pseudo-random function)
- Used for subsequent symmetric encryption communication

**6. Complete Handshake**:
- Client sends: ChangeCipherSpec + Finished
- Server sends: ChangeCipherSpec + Finished
- Handshake complete, begin encrypted communication

### Analyzing TLS Handshake with Wireshark

```bash
# Capture HTTPS traffic
sudo tcpdump -i any port 443 -w tls.pcap

# View in Wireshark:
# 1. Filter TLS handshake packets
ssl.handshake

# 2. View certificate information
ssl.handshake.certificate

# 3. View cipher suite negotiation
ssl.handshake.ciphersuite
```

### Analyzing HTTPS Request Timing with curl

```bash
# Display detailed timing for each phase
curl -w "\n\
DNS resolution: %{time_namelookup}s\n\
TCP connection: %{time_connect}s\n\
TLS handshake: %{time_appconnect}s\n\
Start transfer: %{time_starttransfer}s\n\
Total time: %{time_total}s\n" \
-o /dev/null -s https://example.com

# Example output:
# DNS resolution: 0.015s
# TCP connection: 0.045s
# TLS handshake: 0.120s  ← TLS handshake additional time
# Start transfer: 0.150s
# Total time: 0.180s
```

**Performance Optimization Recommendations**:
- Use TLS 1.3 (reduce handshake round trips)
- Enable TLS session resumption
- Use OCSP Stapling to reduce certificate validation overhead
- Consider using HTTP/2 or HTTP/3

### What Problems Does HTTPS Mainly Solve

- Prevent eavesdropping: Others seeing the packets can't easily read the content directly;
- Prevent tampering: Packet modification in transit is more easily detected;
- Prevent impersonation: Confirm who you're connecting to through the certificate system.

It also manages communication identity and integrity together.

## The HTTP Layer Is Responsible for Semantics, Not Underlying Reliability

This boundary must be clearly distinguished.

HTTP is not responsible for retransmission, packet loss recovery, or flow control—these are handled at the TCP or QUIC layer.

What HTTP is responsible for is expressing requests and responses:

- Methods;
- Status codes;
- Headers;
- Resource semantics;
- Cache negotiation;
- Content negotiation;
- Connection reuse methods.

### The Really High-Frequency HTTP Interview Points Are Actually Just These Few Groups

- Semantic differences between `GET` and `POST`;
- Common status codes;
- Persistent vs. non-persistent connections;
- Cache control;
- Cookie, Session, Token;
- Evolution between versions.

### How to Compare HTTP 1.1, 2, and 3

::: tabs

@tab HTTP/1.1

- After persistent connections became popular, requests don't need to rebuild TCP every time.
- But concurrent capability on the same connection is limited, head-of-line blocking problem is obvious.
- Era was long, ecosystem is mature.

**Head-of-Line Blocking Problem**:
```
Request 1 ━━━━━━━━━━━━━━━━━━━━ (slow)
Request 2 Waiting for request 1 to complete...
Request 3 Waiting for request 1 to complete...
```

**Solutions**:
- Domain sharding (parallel requests to multiple domains)
- Resource merging (CSS Sprites, JS bundling)
- Inline resources (Base64 images)

@tab HTTP/2

- Focus is on binary framing, multiplexing, header compression.
- Multiple requests can be concurrent in one connection, reducing connection count.
- But if still using TCP underneath, transport layer head-of-line blocking hasn't completely disappeared.

**Multiplexing**:
```
Single TCP connection:
Stream 1: ━━ ━━ ━━ ━━
Stream 2:   ━━ ━━ ━━
Stream 3:     ━━ ━━ ━━
(Frames interleaved, no waiting needed)
```

**Header Compression (HPACK)**:
```
Request 1:
:method: GET
:path: /index.html
user-agent: Mozilla/5.0...
accept: text/html...

Request 2: (only send differences)
:path: /style.css
(other headers reference index table)
```

**Server Push**:
```
Client request: GET /index.html
Server response:
  - Return index.html
  - Proactively push style.css
  - Proactively push script.js
(Reduce round trips)
```

**Practice Configuration (Nginx)**:
```nginx
server {
    listen 443 ssl http2;

    # Enable HTTP/2 server push
    location = /index.html {
        http2_push /style.css;
        http2_push /script.js;
    }
}
```

@tab HTTP/3

- Runs on top of QUIC, no longer directly depends on TCP.
- Attempts to further mitigate transport layer blocking problems.
- More suitable for complex scenarios like high packet loss, high latency, mobile networks.

**QUIC Advantages**:
```
TCP + TLS 1.2:
TCP handshake (1 RTT) + TLS handshake (2 RTT) = 3 RTT

QUIC + TLS 1.3:
Combined handshake (1 RTT) or 0-RTT (connection resumption)
```

**Connection Migration**:
```
TCP: Four-tuple (source IP, source port, dest IP, dest port)
     Switching networks (WiFi→4G) requires reconnection

QUIC: Uses Connection ID
      Connection persists after network switch, no reconnection needed
```

**Stream-Level Congestion Control**:
```
TCP: One packet lost, entire connection blocked
QUIC: One stream loses packet, only that stream blocked, others continue
```

:::

### HTTP Performance Optimization Practice

**1. Reduce Request Count**:
```
# Resource merging
cat file1.css file2.css > bundle.css

# Use CSS Sprites
.icon1 { background-position: 0 0; }
.icon2 { background-position: -20px 0; }

# Inline small resources
<img src="data:image/png;base64,iVBORw0KG..." />
```

**2. Enable Compression**:
```nginx
# Nginx configuration
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;
```

**3. Use Caching**:
```
# Strong cache
Cache-Control: max-age=31536000, immutable

# Negotiated cache
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT

# Client requests again
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT

# Server response
304 Not Modified (use cache)
```

**4. Use CDN**:
```
Original: User → Origin server (200ms latency)
CDN:  User → Edge node (20ms latency) → Origin server
```

**5. HTTP/2 Optimization**:
```
# No longer need domain sharding
# No longer need resource merging
# Utilize server push

# But still need to note:
# - Critical resource priority
# - Avoid pushing unneeded resources
```

**6. Pre-connection Optimization**:
```html
<!-- DNS prefetch -->
<link rel="dns-prefetch" href="//example.com">

<!-- Preconnect (DNS+TCP+TLS) -->
<link rel="preconnect" href="https://example.com">

<!-- Preload critical resources -->
<link rel="preload" href="style.css" as="style">

<!-- Prefetch next page resources -->
<link rel="prefetch" href="next-page.html">
```

It's best not to just answer "higher version is faster."

A more solid answer is: each generation is working to reduce extra overhead, improve concurrent transmission efficiency, and lower the cascading impact of blocking.

## When a Request Is Really Slow, the Problem Could Be in Many Places

This is also the most valuable aspect of learning computer networks: it forces you to look at performance from a layered perspective.

A slow-loading webpage could be due to:

- Slow DNS resolution;
- Slow TCP handshake;
- Slow TLS negotiation;
- Application layer cache miss;
- Slow server processing;
- Network packet loss causing retransmission;
- Congestion control reducing sending rate;
- Browser still fetching CSS, JS, images.

So "slow network" is never a single-point answer.

## Why UDP Is Still Important

You can't only talk about TCP when discussing computer networks, or you'll mistakenly think "reliable = omnipotent."

UDP's characteristics are very distinct:

- Small header;
- Light connection burden;
- More real-time friendly;
- Upper layer decides whether to add reliability semantics.

So scenarios like audio/video, real-time interaction, and certain games prefer to stand on UDP or UDP-based protocols to redesign transmission strategies.

This is also why looking at QUIC later becomes very interesting: it moved many transmission capabilities traditionally dependent on TCP to the user-space protocol layer and reorganized them.

> [!note]- How to Answer TCP vs UDP Without Being Vague
> Don't just say "one is reliable, one is unreliable." A better answer is: TCP has built-in mechanisms for ordering, acknowledgment, retransmission, windowing, and congestion control, suitable for general reliable transmission; UDP stays lightweight, leaving more choice to the application layer, more suitable for real-time priority scenarios or custom transmission semantics.

## If the Interviewer Asks You to "Explain from Entering URL to Page Display"

This question is basically a comprehensive computer networks review.

<!--steps-->

1. First talk about parsing the URL, confirming protocol, domain, port, and resource path.
2. Then talk about DNS, translating the domain name to an IP.
3. Next talk about TCP connection establishment, and if it's HTTPS, add TLS handshake.
4. Then talk about HTTP request and response semantics, and differences between versions.
5. Finally add transport layer reliability, congestion control, and the browser continuing to fetch static resources and render the page.

The advantage of this answer approach is:

- You can put DNS, TCP, TLS, HTTP on one line;
- You can talk about both protocol responsibilities and performance impact;
- However the interviewer follows up, you can expand down to the next layer.

## Summary

It's more like a layered collaborative request journey:

- DNS first tells you where the person is;
- TCP or QUIC is responsible for building the channel;
- TLS is responsible for making the channel trustworthy and confidential;
- HTTP is responsible for expressing request and response semantics;
- Flow control, congestion control, retransmission and other mechanisms are responsible for keeping this journey from easily falling apart.

So after truly learning computer networks, when you look at a request, you won't just see "the browser sent an HTTP."

What you'll see is an entire set of protocols working together for the same thing: **delivering a communication as correctly, efficiently, and securely as possible to the other side.**

