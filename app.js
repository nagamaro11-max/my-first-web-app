/* =============================================================
   Sub-Agent Automation System — app.js
   =============================================================
   4つのサブエージェントがタスクキューからタスクを取得し、
   並列で処理するシミュレーションを行います。
   ============================================================= */

(() => {
  "use strict";

  // ── 設定 ──────────────────────────────────
  const TICK_MS = 120;           // メインループ間隔
  const TASK_SPAWN_CHANCE = 0.35; // 毎tick新規タスク生成確率
  const MAX_PENDING = 8;         // 待機キュー最大表示数
  const MAX_DONE = 6;            // 完了ログ最大表示数
  const CHART_BARS = 20;         // スループットチャートのバー数

  // ── タスク定義 ─────────────────────────────
  const TASK_POOL = [
    { name: "データセット前処理",        icon: "📊", type: "前処理",   priority: "high" },
    { name: "NLPトークナイズ",           icon: "🔤", type: "自然言語", priority: "medium" },
    { name: "画像特徴量抽出",            icon: "🖼️", type: "画像処理", priority: "high" },
    { name: "APIレスポンス解析",          icon: "🌐", type: "通信",    priority: "medium" },
    { name: "モデル推論実行",            icon: "🧠", type: "推論",    priority: "high" },
    { name: "ログ集約・フィルタ",         icon: "📋", type: "監視",    priority: "low" },
    { name: "異常検知スキャン",           icon: "🔍", type: "検知",    priority: "high" },
    { name: "レポート生成",              icon: "📄", type: "出力",    priority: "medium" },
    { name: "キャッシュ最適化",           icon: "⚡", type: "最適化",  priority: "low" },
    { name: "セキュリティ検証",           icon: "🔒", type: "検証",    priority: "high" },
    { name: "データベースクエリ最適化",    icon: "🗄️", type: "DB",     priority: "medium" },
    { name: "スケジュールタスク同期",      icon: "🔄", type: "同期",    priority: "low" },
    { name: "メトリクス集計",             icon: "📈", type: "分析",    priority: "medium" },
    { name: "コンテンツ分類",             icon: "🏷️", type: "分類",    priority: "medium" },
    { name: "通知ディスパッチ",           icon: "📡", type: "通信",    priority: "low" },
    { name: "バッチ変換処理",             icon: "🔧", type: "変換",    priority: "high" },
  ];

  const LOG_MESSAGES = {
    start:    ["タスク受信: ", "処理開始: ", "キューから取得: "],
    progress: ["解析中…", "演算実行中…", "データ処理中…", "変換中…", "検証中…"],
    done:     ["完了 ✓", "処理成功 ✓", "出力完了 ✓"],
    idle:     ["待機中…キューを監視", "アイドル状態", "次タスク待ち"],
  };

  // ── 状態 ──────────────────────────────────
  let taskIdCounter = 0;
  const startTime = Date.now();
  const pendingQueue = [];
  const doneList = [];
  const throughputHistory = Array.from({ length: CHART_BARS }, () => ({ tasks: 0, agents: 0 }));
  let totalCompleted = 0;
  let completedLastMinute = [];

  const agents = [
    { id: 0, task: null, progress: 0, completed: 0, startedAt: null, status: "idle" },
    { id: 1, task: null, progress: 0, completed: 0, startedAt: null, status: "idle" },
    { id: 2, task: null, progress: 0, completed: 0, startedAt: null, status: "idle" },
    { id: 3, task: null, progress: 0, completed: 0, startedAt: null, status: "idle" },
  ];

  // ── DOM参照 ────────────────────────────────
  const $ = (id) => document.getElementById(id);

  // ── ユーティリティ ─────────────────────────
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const fmtTime = (ms) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + "s";
    if (s < 3600) return Math.floor(s / 60) + "m " + (s % 60) + "s";
    return Math.floor(s / 3600) + "h " + Math.floor((s % 3600) / 60) + "m";
  };

  // ── パーティクルキャンバス ─────────────────
  function initParticles() {
    const canvas = $("particle-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h;
    const particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // パーティクル生成
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // 接続線
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // パーティクル描画
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── スクロールRevealアニメーション ──────────
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
  }

  // ── スループットチャート初期化 ─────────────
  function initChart() {
    const chart = $("throughput-chart");
    if (!chart) return;
    chart.innerHTML = "";
    for (let i = 0; i < CHART_BARS; i++) {
      const group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = `<div class="chart-bar tasks" id="cb-t-${i}" style="height:4px"></div>
                          <div class="chart-bar agents" id="cb-a-${i}" style="height:4px"></div>`;
      chart.appendChild(group);
    }
  }

  // ── ログ追加 ───────────────────────────────
  function addLog(agentId, message, type = "") {
    const log = $(`log-${agentId}`);
    if (!log) return;
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    entry.textContent = `[${ts}] ${message}`;
    log.insertBefore(entry, log.firstChild);
    // 最大4行
    while (log.children.length > 4) {
      log.removeChild(log.lastChild);
    }
  }

  // ── 待機キューUI更新 ──────────────────────
  function renderPendingQueue() {
    const ul = $("pending-queue");
    if (!ul) return;
    ul.innerHTML = "";
    const display = pendingQueue.slice(0, MAX_PENDING);
    for (const task of display) {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <div class="task-icon">${task.icon}</div>
        <div class="task-info">
          <div class="task-name">${task.name}</div>
          <div class="task-type">${task.type} · #${task.id}</div>
        </div>
        <div class="task-priority p-${task.priority}">${task.priority}</div>`;
      ul.appendChild(li);
    }
    if (pendingQueue.length > MAX_PENDING) {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `<div class="task-icon">…</div>
        <div class="task-info"><div class="task-name">他 ${pendingQueue.length - MAX_PENDING} 件が待機中</div></div>`;
      ul.appendChild(li);
    }
    if (pendingQueue.length === 0) {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `<div class="task-icon">💤</div>
        <div class="task-info"><div class="task-name" style="color:var(--text-muted)">キュー空 — 新規タスク待ち</div></div>`;
      ul.appendChild(li);
    }
  }

  // ── 完了ログUI更新 ────────────────────────
  function renderDoneQueue() {
    const ul = $("done-queue");
    if (!ul) return;
    ul.innerHTML = "";
    const display = doneList.slice(-MAX_DONE).reverse();
    for (const task of display) {
      const li = document.createElement("li");
      li.className = "task-item";
      li.style.borderColor = "rgba(0,255,157,0.15)";
      li.innerHTML = `
        <div class="task-icon">${task.icon}</div>
        <div class="task-info">
          <div class="task-name">${task.name}</div>
          <div class="task-type">${task.type} · Agent ${["Alpha","Beta","Gamma","Delta"][task.completedBy]} · ${task.duration}s</div>
        </div>
        <div class="task-priority" style="background:rgba(0,255,157,0.15);color:var(--accent-green)">done</div>`;
      ul.appendChild(li);
    }
    if (doneList.length === 0) {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `<div class="task-icon">⏳</div>
        <div class="task-info"><div class="task-name" style="color:var(--text-muted)">まだ完了タスクなし</div></div>`;
      ul.appendChild(li);
    }
  }

  // ── エージェントUI更新 ─────────────────────
  function updateAgentUI(agent) {
    const badge = $(`badge-${agent.id}`);
    const taskEl = $(`task-${agent.id}`);
    const fill = $(`fill-${agent.id}`);
    const pct = $(`pct-${agent.id}`);
    const completedEl = $(`completed-${agent.id}`);
    const speedEl = $(`speed-${agent.id}`);
    const uptimeEl = $(`uptime-${agent.id}`);
    const card = document.querySelector(`.agent-card[data-agent="${agent.id}"]`);

    if (!badge) return;

    // ステータスバッジ
    badge.className = "agent-status-badge";
    if (agent.status === "idle") {
      badge.classList.add("status-idle");
      badge.textContent = "待機中";
      card.classList.remove("processing");
    } else if (agent.status === "active") {
      badge.classList.add("status-active");
      badge.textContent = "処理中";
      card.classList.add("processing");
    } else if (agent.status === "done") {
      badge.classList.add("status-done");
      badge.textContent = "完了";
      card.classList.remove("processing");
    }

    // タスク名
    if (agent.task) {
      taskEl.textContent = `${agent.task.icon} ${agent.task.name}`;
    } else {
      taskEl.textContent = "— タスク待機中 —";
    }

    // プログレスバー
    fill.style.width = `${agent.progress}%`;
    pct.textContent = `${Math.floor(agent.progress)}%`;

    // ミニ統計
    completedEl.textContent = agent.completed;
    speedEl.textContent = agent.completed > 0
      ? (agent.completed / ((Date.now() - startTime) / 60000)).toFixed(1) + "/m"
      : "—";
    uptimeEl.textContent = fmtTime(Date.now() - startTime);
  }

  // ── グローバル統計更新 ─────────────────────
  function updateGlobalStats() {
    const now = Date.now();
    completedLastMinute = completedLastMinute.filter((t) => now - t < 60000);

    const statCompleted = $("stat-completed");
    const statSpeed = $("stat-speed");
    const statUptime = $("stat-uptime");
    const statParallel = $("stat-parallel");

    if (statCompleted) statCompleted.textContent = totalCompleted;
    if (statSpeed) statSpeed.textContent = completedLastMinute.length;
    if (statUptime) statUptime.textContent = fmtTime(now - startTime);

    // 現在並列処理中の数
    const activeCount = agents.filter((a) => a.status === "active").length;
    if (statParallel) statParallel.textContent = activeCount;

    const delta = $("stat-parallel-delta");
    if (delta) delta.textContent = activeCount === 4 ? "★ フル稼働中!" : `↑ ${activeCount}/4 稼働`;
  }

  // ── スループットチャート更新 ───────────────
  function updateChart() {
    const activeCount = agents.filter((a) => a.status === "active").length;
    const recentDone = doneList.filter((t) => Date.now() - t.finishedAt < 1000).length;

    throughputHistory.push({ tasks: recentDone, agents: activeCount });
    if (throughputHistory.length > CHART_BARS) throughputHistory.shift();

    for (let i = 0; i < CHART_BARS; i++) {
      const d = throughputHistory[i] || { tasks: 0, agents: 0 };
      const tBar = $(`cb-t-${i}`);
      const aBar = $(`cb-a-${i}`);
      if (tBar) tBar.style.height = Math.max(4, d.tasks * 30) + "px";
      if (aBar) aBar.style.height = Math.max(4, d.agents * 25) + "px";
    }
  }

  // ── タスク生成 ─────────────────────────────
  function maybeSpawnTask() {
    if (Math.random() < TASK_SPAWN_CHANCE && pendingQueue.length < 15) {
      const template = pick(TASK_POOL);
      const task = {
        ...template,
        id: ++taskIdCounter,
        duration: randInt(3, 12), // 処理に必要なtick数
        createdAt: Date.now(),
      };
      pendingQueue.push(task);
    }
  }

  // ── エージェントメインループ ──────────────
  function tickAgent(agent) {
    if (agent.status === "idle" || agent.status === "done") {
      // タスクを取得
      if (pendingQueue.length > 0) {
        agent.task = pendingQueue.shift();
        agent.progress = 0;
        agent.status = "active";
        agent.startedAt = Date.now();
        addLog(agent.id, pick(LOG_MESSAGES.start) + agent.task.name, "info");
      } else {
        agent.status = "idle";
        agent.progress = 0;
        if (Math.random() < 0.02) {
          addLog(agent.id, pick(LOG_MESSAGES.idle));
        }
      }
    }

    if (agent.status === "active" && agent.task) {
      // 進捗を加算（ランダムに速度変動）
      const increment = (100 / agent.task.duration) * (0.7 + Math.random() * 0.6);
      agent.progress = Math.min(100, agent.progress + increment);

      // 途中ログ
      if (agent.progress > 30 && agent.progress < 35) {
        addLog(agent.id, pick(LOG_MESSAGES.progress));
      }
      if (agent.progress > 65 && agent.progress < 70) {
        addLog(agent.id, pick(LOG_MESSAGES.progress));
      }

      // 完了
      if (agent.progress >= 100) {
        agent.progress = 100;
        agent.completed++;
        totalCompleted++;
        completedLastMinute.push(Date.now());

        const finishedTask = {
          ...agent.task,
          completedBy: agent.id,
          finishedAt: Date.now(),
          duration: ((Date.now() - agent.startedAt) / 1000).toFixed(1),
        };
        doneList.push(finishedTask);

        addLog(agent.id, pick(LOG_MESSAGES.done) + ` [${agent.task.name}]`, "ok");
        agent.status = "done";
        agent.task = null;
      }
    }

    updateAgentUI(agent);
  }

  // ── メインループ ──────────────────────────
  function mainLoop() {
    maybeSpawnTask();

    for (const agent of agents) {
      tickAgent(agent);
    }

    renderPendingQueue();
    renderDoneQueue();
    updateGlobalStats();
    updateChart();
  }

  // ── 初期化 ────────────────────────────────
  function init() {
    initParticles();
    initReveal();
    initChart();

    // 初期タスクを数件投入
    for (let i = 0; i < 6; i++) {
      const template = pick(TASK_POOL);
      pendingQueue.push({
        ...template,
        id: ++taskIdCounter,
        duration: randInt(3, 12),
        createdAt: Date.now(),
      });
    }

    renderPendingQueue();
    renderDoneQueue();

    // メインループ開始
    setInterval(mainLoop, TICK_MS);

    // チャート更新は少し遅めに
    setInterval(updateChart, 1000);
  }

  // DOM準備完了後に初期化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
