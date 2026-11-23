
/* GrantPath AI — Gemini-powered educational assistant */
(function () {
  'use strict';

  if (document.getElementById('gpai-root')) return;

  /* ---------- Тематические направления ---------- */

  const C = [
    {
      id: 'career',
      name: 'Career Advisor',
      desc: 'профориентация',
      qs: [
        'Как выбрать профессию?',
        'Какие профессии будут востребованы?',
        'Как определить свои сильные стороны?'
      ]
    },
    {
      id: 'univ',
      name: 'University Finder',
      desc: 'подбор университетов',
      qs: [
        'Подбери университеты для моего профиля',
        'Какие университеты входят в Ivy League?',
        'Что такое Reach, Match и Safety?'
      ]
    },
    {
      id: 'schol',
      name: 'Scholarship Advisor',
      desc: 'гранты и стипендии',
      qs: [
        'Какие есть международные гранты?',
        'Как получить полную стипендию?',
        'Как повысить шансы на грант?'
      ]
    },
    {
      id: 'admit',
      name: 'Admission Guide',
      desc: 'поступление',
      qs: [
        'Какие документы нужны для поступления?',
        'Когда начинать подготовку?',
        'Как правильно составить заявку?'
      ]
    },
    {
      id: 'exam',
      name: 'Exam Mentor',
      desc: 'SAT, IELTS, TOEFL',
      qs: [
        'Как подготовиться к SAT?',
        'Как получить IELTS 7.0?',
        'Составь план подготовки к экзаменам'
      ]
    },
    {
      id: 'essay',
      name: 'Essay Assistant',
      desc: 'эссе и мотивационные письма',
      qs: [
        'Как написать сильное мотивационное письмо?',
        'Помоги придумать тему эссе',
        'Проверь структуру моего эссе'
      ]
    },
    {
      id: 'abroad',
      name: 'Study Abroad Advisor',
      desc: 'обучение за рубежом',
      qs: [
        'Как выбрать страну для обучения?',
        'Сколько стоит обучение за границей?',
        'Какие есть программы обмена?'
      ]
    }
  ];

  /* ---------- Вспомогательные функции ---------- */

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V5"/><circle cx="12" cy="3.6" r="1.1"/><circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none"/><path d="M9.5 16.2h5M2 13v2.5M22 13v2.5"/></svg>';

  let cid = C[0].id;
  let history = [];
  let isLoading = false;

  const cur = () => C.find(c => c.id === cid);

  /* ---------- Создание интерфейса ---------- */

  const root = el('div');
  root.id = 'gpai-root';

  const fab = el('button', 'gpai-fab');
  fab.type = 'button';
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML =
    '<span class="gpai-fab-ico">' + ICON +
    '</span><span>GrantPath AI Assistant</span>';

  const panel = el('div', 'gpai-panel');
  panel.hidden = true;
  panel.tabIndex = -1;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'GrantPath AI Assistant');

  /* ---------- Заголовок ---------- */

  const head = el('div', 'gpai-head');

  const hico = el('span', 'gpai-head-ico');
  hico.innerHTML = ICON;

  const ttl = el('div', 'gpai-title');
  ttl.appendChild(el('b', null, 'GrantPath AI Assistant'));
  ttl.appendChild(el('small', null, 'AI-powered educational consultant'));

  const clr = el('button', 'gpai-hbtn', 'Очистить');
  clr.type = 'button';

  const cls = el('button', 'gpai-hbtn gpai-x', '×');
  cls.type = 'button';
  cls.setAttribute('aria-label', 'Закрыть помощник');

  head.append(hico, ttl, clr, cls);

  /* ---------- Консультанты ---------- */

  const tabs = el('div', 'gpai-tabs');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Выбор направления');

  const tabBtns = C.map(c => {
    const b = el('button', 'gpai-tab');
    b.type = 'button';

    b.appendChild(el('b', null, c.name));
    b.appendChild(el('small', null, c.desc));

    b.addEventListener('click', () => switchTo(c.id));

    tabs.appendChild(b);

    return { b, id: c.id };
  });

  /* ---------- История сообщений ---------- */

  const logEl = el('div', 'gpai-log');
  logEl.setAttribute('role', 'log');
  logEl.setAttribute('aria-live', 'polite');

  /* ---------- Предложенные вопросы ---------- */

  const qs = el('div', 'gpai-qs');

  const qsTitle = el('div', 'gpai-qs-title');
  const qsList = el('div');

  qs.append(qsTitle, qsList);

  const backbar = el('div', 'gpai-backbar');

  const back = el('button', 'gpai-back', '← К списку вопросов');
  back.type = 'button';

  backbar.appendChild(back);

  /* ---------- Поле ввода ---------- */

  const form = el('form', 'gpai-form');
  form.setAttribute('autocomplete', 'off');

  const input = el('input', 'gpai-input');
  input.type = 'text';
  input.placeholder = 'Спросите что-нибудь...';
  input.setAttribute('aria-label', 'Ваш вопрос');
  input.maxLength = 3000;

  const send = el('button', 'gpai-send', 'Отправить');
  send.type = 'submit';

  form.append(input, send);

  const note = el(
    'div',
    'gpai-note',
    'GrantPath AI использует искусственный интеллект. Проверяйте актуальные требования и дедлайны на официальных сайтах.'
  );

  panel.append(head, tabs, logEl, qs, backbar, form, note);

  root.append(fab, panel);
  document.body.appendChild(root);

  /* ---------- Форматирование ответов ---------- */

  function addMsg(role, who, content) {
    const m = el('div', 'gpai-msg gpai-' + role);

    if (who) {
      m.appendChild(el('span', 'gpai-who', who));
    }

    const lines = String(content).split('\n');
    let ul = null;

    lines.forEach(raw => {
      const line = raw.trim();

      if (!line) {
        ul = null;
        return;
      }

      if (/^[-*•]\s/.test(line)) {
        if (!ul) {
          ul = el('ul');
          m.appendChild(ul);
        }

        ul.appendChild(el('li', null, line.replace(/^[-*•]\s/, '')));
        return;
      }

      ul = null;

      const clean = line.replace(/^#{1,6}\s*/, '');

      m.appendChild(el('p', null, clean));
    });

    logEl.appendChild(m);
    logEl.scrollTop = logEl.scrollHeight;

    return m;
  }

  function reveal(n) {
    logEl.scrollTop =
      n.getBoundingClientRect().top -
      logEl.getBoundingClientRect().top +
      logEl.scrollTop - 8;
  }

  /* ---------- Режимы интерфейса ---------- */

  function setMode(mode) {
    qs.hidden = mode !== 'list';
    backbar.hidden = mode !== 'answer';
  }

  function renderTabs() {
    tabBtns.forEach(t => {
      t.b.setAttribute('aria-pressed', String(t.id === cid));
    });
  }

  function renderQs() {
    const c = cur();

    qsTitle.textContent = 'Направление: ' + c.name;

    qsList.textContent = '';

    c.qs.forEach(question => {
      const b = el('button', 'gpai-q', question);

      b.type = 'button';

      b.addEventListener('click', () => {
        sendMessage(question);
      });

      qsList.appendChild(b);
    });
  }

  function switchTo(id) {
    if (id !== cid) {
      cid = id;

      renderTabs();
      renderQs();

      const c = cur();

      addMsg(
        'sys',
        null,
        'Вы выбрали направление: ' + c.name + '. Можете задать любой вопрос.'
      );
    }

    setMode('list');
    logEl.scrollTop = logEl.scrollHeight;
  }

  /* ---------- Индикатор загрузки ---------- */

  function showTyping() {
    const m = el('div', 'gpai-msg gpai-bot gpai-typing');

    m.appendChild(
      el('span', 'gpai-who', 'GrantPath AI')
    );

    m.appendChild(
      el('p', null, 'Думаю над ответом...')
    );

    logEl.appendChild(m);
    logEl.scrollTop = logEl.scrollHeight;

    return m;
  }

  /* ---------- Настройка кнопок ---------- */

  function setLoading(value) {
    isLoading = value;

    send.disabled = value;
    input.disabled = value;

    send.textContent = value ? 'Ожидание...' : 'Отправить';

    send.setAttribute('aria-busy', String(value));
  }

  /* ---------- Главное: запрос к Gemini ---------- */

  async function sendMessage(text) {
    const message = String(text || '').trim();

    if (!message || isLoading) return;

    input.value = '';

    const userMsg = addMsg('user', 'Вы', message);

    const typing = showTyping();

    setMode('answer');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          message: message,
          history: history.slice(-20)
        })
      });

      let data;

      try {
        data = await response.json();
      } catch (_) {
        throw new Error('Сервер вернул некорректный ответ');
      }

      if (!response.ok) {
        throw new Error(
          data.error || 'Ошибка подключения к GrantPath AI'
        );
      }

      if (!data.answer || typeof data.answer !== 'string') {
        throw new Error('AI не вернул ответ');
      }

      typing.remove();

      addMsg(
        'bot',
        'GrantPath AI',
        data.answer
      );

      history.push({
        role: 'user',
        text: message
      });

      history.push({
        role: 'model',
        text: data.answer
      });

      history = history.slice(-20);

    } catch (error) {
      console.error('GrantPath AI error:', error);

      typing.remove();

      addMsg(
        'bot',
        'GrantPath AI',
        'Не удалось получить ответ от ИИ.\n\n' +
        'Возможная причина: проблема с сервером или подключением Gemini API.\n\n' +
        'Попробуйте отправить сообщение ещё раз.'
      );

    } finally {
      setLoading(false);
      input.focus();
      reveal(userMsg);
    }
  }

  /* ---------- Приветствие и очистка ---------- */

  function welcome() {
    addMsg(
      'sys',
      null,
      'Здравствуйте! Я GrantPath AI — ваш интеллектуальный образовательный консультант.\n\n' +
      'Я помогу с грантами, университетами, поступлением, SAT, IELTS, мотивационными письмами и другими образовательными вопросами.\n\n' +
      'Задавайте любой вопрос. Я готов помочь!'
    );
  }

  function reset() {
    if (isLoading) return;

    history = [];

    logEl.textContent = '';
    input.value = '';

    welcome();

    setMode('list');
  }

  /* ---------- События ---------- */

  back.addEventListener('click', () => {
    setMode('list');
    logEl.scrollTop = logEl.scrollHeight;
  });

  clr.addEventListener('click', reset);

  form.addEventListener('submit', e => {
    e.preventDefault();

    sendMessage(input.value);
  });

  function openPanel() {
    panel.hidden = false;
    fab.hidden = true;

    fab.setAttribute('aria-expanded', 'true');

    panel.focus({ preventScroll: true });

    logEl.scrollTop = logEl.scrollHeight;
  }

  function closePanel() {
    panel.hidden = true;
    fab.hidden = false;

    fab.setAttribute('aria-expanded', 'false');

    fab.focus({ preventScroll: true });
  }

  fab.addEventListener('click', openPanel);

  cls.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (
      e.key === 'Escape' &&
      !panel.hidden &&
      panel.contains(document.activeElement)
    ) {
      closePanel();
    }
  });

  /* ---------- Запуск ---------- */

  renderTabs();
  renderQs();

  welcome();

  setMode('list');

})();
