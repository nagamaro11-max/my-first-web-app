/* =============================================
   Sub-Agent Automation System — app.js
   ============================================= */

'use strict';

/* =============================================
   PARTICLE SYSTEM
   ============================================= */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const COUNT = 90;
  const COLORS = ['#00d4ff', '#7c3aed', '#00ff9d', '#ff6b35'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticle() {
    return {
      x:     rand(0, W),
      y:     rand(0, H),
      r:     rand(0.6, 2.2),
      vx:    rand(-0.25, 0.25),
      vy:    rand(-0.35, -0.08),
      alpha: rand(0.15, 0.7),
      da:    rand(-0.003, 0.003),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, createParticle);
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.alpha += p.da;

      if (p.alpha <= 0 || p.alpha >= 0.75) p.da = -p.da;
      if (p.y < -10) { p.y = H + 10; p.x = rand(0, W); }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // draw faint connecting lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#00d4ff';
          ctx.globalAlpha = (1 - dist / 90) * 0.06;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  init();
  tick();
})();

/* =============================================
   SCROLL REVEAL
   ============================================= */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach(el => obs.observe(el));
})();

/* =============================================
   AGENT SIMULATION ENGINE
   ============================================= */
const Sim = (() => {
  /* ---- Task pool ---- */
  const TASKS = [
    { name: 'データセット解析',      type: '機械学習',         icon: '📊', priority: 'high',   dur: [3500, 6000] },
    { name: 'API レスポンス検証',    type: 'ネットワーク',     icon: '🌐', priority: 'medium', dur: [2500, 5000] },
    { name: 'ログ異常検知',          type: 'セキュリティ',     icon: '🔍', priority: 'high',   dur: [4000, 7000] },
    { name: 'モデル推論バッチ',      type: 'AI/ML',            icon: '🧠', priority: 'high',   dur: [5000, 9000] },
    { name: 'キャッシュ最適化',      type: 'パフォーマンス',   icon: '⚡', priority: 'low',    dur: [2000, 4000] },
    { name: 'トークナイザー処理',    type: 'NLP',               icon: '📝', priority: 'medium', dur: [3000, 5500] },
    { name: 'ベクトル埋め込み生成',  type: 'AI/ML',            icon: '🔢', priority: 'medium', dur: [4500, 7500] },
    { name: 'リアルタイム翻訳',      type: 'NLP',               icon: '🌏', priority: 'high',   dur: [3000, 5000] },
    { name: 'スケジューラ最適化',    type: 'オーケストレーション', icon: '📅', priority: 'low', dur: [2500, 4500] },
    { name: 'コード品質チェック',    type: '開発',              icon: '💻', priority: 'medium', dur: [3500, 6500] },
    { name: '画像認識パイプライン',  type: 'ビジョン',         icon: '🖼️', priority: 'high',   dur: [5000, 8500] },
    { name: 'レポート自動生成',      type: '出力',              icon: '📄', priority: 'low',    dur: [2000, 3500] },
    { name: 'クラスタリング処理',    type: '統計',              icon: '🎯', priority: 'medium', dur: [4000, 6000] },
    { name: '依存関係グラフ構築',    type: '構造解析',         icon: '🕸️', priority: 'low',    dur: [3000, 5000] },
    { name: '音声テキスト変換',      type: '音声処理',         icon: '🎤', priority: 'high',   dur: [4500, 8000] },
    { name: 'エラーリカバリ処理',    type: '障害対応',         icon: '🛡️', priority: 'high',   dur: [2500, 4500] },
  ];

  const LOG_MESSAGES = [
    ['[INFO] データを読み込み中...', 'info'],
    ['[INFO] モデルを初期化しています', 'info'],
    ['[PROC] バッチを処理中 (1/3)...', 'info'],
    ['[PROC] バッチを処理中 (2/3)...', 'info'],
    ['[PROC] バッチを処理中 (3/3)...', 'info'],
    ['[CALC] パラメータを最適化中...', 'info'],
    ['[NET]  接続を確立しています...', 'info'],
    ['[MEM]  キャッシュを確認中...', 'info'],
    ['[WARN] レイテンシ上昇を検知', 'warn'],
    ['[INFO] リトライ中 (1/3)...', 'warn'],
    ['[INFO] チェックポイント保存済み', 'info'],
    ['[INFO] 結果をシリアライズ中...', 'info'],
    ['[INFO] バリデーション通過', 'ok'],
    ['[PROC] 後処理を実行中...', 'info'],
  ];

  /* ---- Agents ---- */
  const agents = [0, 1, 2, 3].map(i => ({
    id: i,
    busy: false,
    completed: 0,
    startTime: Date.now(),
    currentTask: null,
  }));

  /* ---- State ---- */
  let pendingQueue   = [];
  let doneLog        = [];
  let totalCompleted = 0;
  let completedTimes = [];
  let throughputHistory = Array.from({ length: 20 }, () => ({ tasks: 0, agents: 0 }));

  /* ---- DOM helpers ---- */
  const $  = id => document.getElementById(id);
  const fmt = n  => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

  function setBadge(agentId, text, cls) {
    const el = $(`badge-${agentId}`);
    if (!el) return;
    el.textContent = text;
    el.className = `agent-status-badge ${cls}`;
  }

  function setTask(agentId, text) {
    const el = $(`task-${agentId}`);
    if (el) el.textContent = text;
  }

  function setProgress(agentId, pct) {
    const fill = $(`fill-${agentId}`);
    const pctEl = $(`pct-${agentId}`);
    const track = fill && fill.closest('[role="progressbar"]');
    if (fill)  fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (track) track.setAttribute('aria-valuenow', pct);
  }

  function setCardState(agentId, state) {
    const card = document.querySelector(`.agent-card[data-agent="${agentId}"]`);
    if (!card) return;
    card.classList.remove('processing', 'idle', 'done');
    if (state) card.classList.add(state);
  }

  function addLog(agentId, text, type) {
    const container = $(`log-${agentId}`);
    if (!container) return;
    // Keep max 3 lines visible
    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }
    const el = document.createElement('div');
    el.className = 'log-entry' + (type ? ' ' + type : '');
    el.textContent = text;
    container.appendChild(el);
  }

  function updateMiniStats(agentId) {
    const a = agents[agentId];
    const el = $(`completed-${agentId}`);
    if (el) el.textContent = a.completed;

    const elapsed = (Date.now() - a.startTime) / 60000;
    const speed = elapsed > 0.1 ? (a.completed / elapsed).toFixed(1) : '—';
    const speedEl = $(`speed-${agentId}`);
    if (speedEl) speedEl.textContent = speed;
  }

  /* ---- Task queue rendering ---- */
  function renderPendingQueue() {
    const ul = $('pending-queue');
    if (!ul) return;
    ul.innerHTML = '';
    const slice = pendingQueue.slice(0, 7);
    if (slice.length === 0) {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.style.cssText = 'opacity:0.4;justify-content:center;font-size:0.72rem;';
      li.textContent = '— キューが空です —';
      ul.appendChild(li);
      return;
    }
    slice.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML = `
        <span class="task-icon">${t.icon}</span>
        <div class="task-info">
          <div class="task-name">${t.name}</div>
          <div class="task-type">${t.type}</div>
        </div>
        <span class="task-priority p-${t.priority}">${t.priority}</span>
      `;
      ul.appendChild(li);
    });
  }

  function renderDoneLog() {
    const ul = $('done-queue');
    if (!ul) return;
    ul.innerHTML = '';
    const slice = doneLog.slice(0, 7);
    if (slice.length === 0) {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.style.cssText = 'opacity:0.4;justify-content:center;font-size:0.72rem;';
      li.textContent = '— 完了タスクなし —';
      ul.appendChild(li);
      return;
    }
    slice.forEach(t => {
      const li = document.createElement('li');
      li.className = 'task-item';
      const secs = Math.round((Date.now() - t.finishedAt) / 1000);
      li.innerHTML = `
        <span class="task-icon">✅</span>
        <div class="task-info">
          <div class="task-name">${t.name}</div>
          <div class="task-type">${secs}秒前</div>
        </div>
        <span class="task-priority p-low">完了</span>
      `;
      ul.appendChild(li);
    });
  }

  /* ---- Global stats ---- */
  function updateGlobalStats() {
    const completedEl = $('stat-completed');
    if (completedEl) completedEl.textContent = fmt(totalCompleted);

    const now = Date.now();
    const recent = completedTimes.filter(t => now - t < 60000).length;
    const speedEl = $('stat-speed');
    if (speedEl) speedEl.textContent = recent;
  }

  /* ---- Throughput chart ---- */
  function updateChart(tasksThisTick, activeAgents) {
    throughputHistory.shift();
    throughputHistory.push({ tasks: tasksThisTick, agents: activeAgents });

    const chart = $('throughput-chart');
    if (!chart) return;

    const maxTasks  = Math.max(1, ...throughputHistory.map(b => b.tasks));
    const maxAgents = Math.max(1, ...throughputHistory.map(b => b.agents));

    chart.innerHTML = '';
    throughputHistory.forEach(bucket => {
      const group = document.createElement('div');
      group.className = 'bar-group';

      const b1 = document.createElement('div');
      b1.className = 'chart-bar tasks';
      b1.style.height = (bucket.tasks  / maxTasks  * 100) + '%';

      const b2 = document.createElement('div');
      b2.className = 'chart-bar agents';
      b2.style.height = (bucket.agents / maxAgents * 100) + '%';

      group.appendChild(b1);
      group.appendChild(b2);
      chart.appendChild(group);
    });
  }

  /* ---- Uptime counter ---- */
  const appStart = Date.now();

  function updateUptime() {
    const s = Math.floor((Date.now() - appStart) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const str = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;

    const el = $('stat-uptime');
    if (el) el.textContent = str;

    agents.forEach(a => {
      const as = Math.floor((Date.now() - a.startTime) / 1000);
      const aEl = $(`uptime-${a.id}`);
      if (aEl) {
        const am = Math.floor(as / 60);
        aEl.textContent = am > 0 ? `${am}m ${as % 60}s` : `${as}s`;
      }
    });
  }

  /* ---- Core: assign task to agent ---- */
  function assignTask(agent) {
    if (pendingQueue.length === 0) return;
    const task = pendingQueue.shift();
    agent.busy = true;
    agent.currentTask = task;

    renderPendingQueue();
    setCardState(agent.id, 'processing');
    setBadge(agent.id, '処理中', 'status-active');
    setTask(agent.id, `${task.icon} ${task.name}`);
    setProgress(agent.id, 0);
    addLog(agent.id, `[INFO] タスク開始: ${task.name}`, 'info');

    const totalDur = task.dur[0] + Math.random() * (task.dur[1] - task.dur[0]);
    const tickMs   = 250;
    const steps    = Math.round(totalDur / tickMs);
    let   step     = 0;
    let   nextLogAt = Math.floor(steps * (0.2 + Math.random() * 0.25));

    const interval = setInterval(() => {
      step++;
      const pct = Math.min(100, Math.round((step / steps) * 100));
      setProgress(agent.id, pct);

      if (step === nextLogAt) {
        const [msg, type] = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
        addLog(agent.id, msg, type);
        nextLogAt += Math.floor(steps * (0.15 + Math.random() * 0.2));
      }

      if (step >= steps) {
        clearInterval(interval);

        agent.busy = false;
        agent.completed++;
        totalCompleted++;
        completedTimes.push(Date.now());

        doneLog.unshift({ ...task, finishedAt: Date.now() });
        if (doneLog.length > 20) doneLog.pop();

        setProgress(agent.id, 100);
        setBadge(agent.id, '完了', 'status-done');
        setCardState(agent.id, '');
        addLog(agent.id, `[OK]   完了: ${task.name}`, 'ok');
        updateMiniStats(agent.id);
        updateGlobalStats();
        renderDoneLog();

        // brief completion pause, then go idle
        setTimeout(() => {
          setBadge(agent.id, '待機中', 'status-idle');
          setTask(agent.id, '— タスク待機中 —');
          setProgress(agent.id, 0);
          setCardState(agent.id, 'idle');
          agent.currentTask = null;

          setTimeout(() => tryAssign(agent.id), 300 + Math.random() * 600);
        }, 600);
      }
    }, tickMs);
  }

  function tryAssign(agentId) {
    const agent = agents[agentId];
    if (!agent.busy && pendingQueue.length > 0) {
      assignTask(agent);
    }
  }

  /* ---- Task generator ---- */
  function spawnTask() {
    if (pendingQueue.length >= 10) return;
    const task = { ...TASKS[Math.floor(Math.random() * TASKS.length)] };
    pendingQueue.push(task);
    renderPendingQueue();

    // Immediately hand off to a free agent if available
    const idle = agents.find(a => !a.busy);
    if (idle) assignTask(idle);
  }

  /* ---- Tick loop (250ms) ---- */
  let tickCount = 0;

  function gameTick() {
    tickCount++;

    updateUptime();

    const activeAgents = agents.filter(a => a.busy).length;

    if (tickCount % 4 === 0) {
      const now = Date.now();
      const recentCompletions = completedTimes.filter(t => now - t < 1000).length;
      updateChart(recentCompletions, activeAgents);
    }

    const navStatus = $('nav-status-text');
    if (navStatus) {
      navStatus.textContent = activeAgents > 0
        ? `${activeAgents}エージェント稼働中`
        : 'システム稼働中';
    }
  }

  /* ---- Boot ---- */
  function boot() {
    // Pre-fill task queue
    for (let i = 0; i < 6; i++) {
      pendingQueue.push({ ...TASKS[i % TASKS.length] });
    }
    renderPendingQueue();
    renderDoneLog();
    updateChart(0, 0);

    // Staggered agent start
    agents.forEach((agent, i) => {
      setTimeout(() => {
        setCardState(agent.id, 'idle');
        setBadge(agent.id, '待機中', 'status-idle');
        tryAssign(agent.id);
      }, i * 700 + 400);
    });

    // Spawn new tasks at ~3–5s intervals
    setInterval(spawnTask, 3500 + Math.random() * 1500);

    // Main simulation tick
    setInterval(gameTick, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return { agents, pendingQueue };
})();
