const modeMeta = {
  summary: {
    title: 'Smart Summary',
    description: 'Key ideas, definitions, and action items packed into bite-sized bullets.'
  },
  flashcards: {
    title: 'Flashcard Pack',
    description: 'Generate rapid-fire Q&A cards that cover definitions and applications.'
  },
  quizzes: {
    title: 'Quiz Builder',
    description: 'Mix of short, medium, and long-answer prompts with suggested answers.'
  },
  study: {
    title: 'Study Guide',
    description: 'Organized outline with focus areas, memory hooks, and next steps.'
  },
  timetable: {
    title: 'Revision Timetable',
    description: 'Balanced calendar that distributes your topics across the week.'
  },
  mindmap: {
    title: 'Mind Map (Plus)',
    description: 'Visual node layout with branches and supporting details.'
  },
  tutor: {
    title: 'AI Tutor (Plus)',
    description: 'Conversational guidance, analogies, and follow-up prompts.'
  }
};

const premiumModes = ['mindmap', 'tutor'];

const sampleNotes = {
  default: `Photosynthesis is the process used by plants to convert light energy into chemical energy stored in glucose.
Chlorophyll within the chloroplast absorbs light predominantly in the blue and red wavelengths.
Light-dependent reactions generate ATP and NADPH, while the Calvin cycle fixes carbon dioxide into sugars.
Stomata regulate gas exchange but close during drought to reduce transpiration.
Exam tip: link photosynthesis efficiency to limiting factors such as light intensity, CO2 concentration, and temperature.`,
  photo: `Handwritten calculus notes:
- Derivative measures rate of change.
- Power rule: d/dx (x^n) = n * x^(n-1).
- Product rule: (fg)' = f'g + fg'.
Reminder: always annotate units and state domain restrictions.`,
  textbook: `Chapter 4: Plate Tectonics
The lithosphere is broken into plates floating on the asthenosphere.
Convergent boundaries recycle crust via subduction.
Divergent boundaries create new crust along mid-ocean ridges.
Transform boundaries store elastic energy that is released as earthquakes.
Case study: 2011 Tōhoku earthquake triggered a tsunami due to sudden plate motion.`,
  pdf: `Business case study:
A retail startup noticed cart abandonment rising to 68%.
Hypothesis: checkout friction and unclear return policy.
Experiment: add express pay, highlight guarantees, and send reminder emails.
Result: conversion rate improved by 18% in four weeks.
Lesson: combine UX fixes with lifecycle messaging for compounding gains.`
};

const utils = {
  sentences(text) {
    return (text.match(/[^.!?]+[.!?]?/g) || []).map((s) => s.trim()).filter(Boolean);
  },
  words(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);
  },
  keywords(text, limit = 8) {
    const stop = new Set(['the', 'and', 'for', 'with', 'that', 'from', 'this', 'have', 'into', 'your', 'their']);
    const freq = {};
    this.words(text).forEach((word) => {
      if (word.length < 3 || stop.has(word)) return;
      freq[word] = (freq[word] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }
};

const generators = {
  summary(text) {
    const sentences = utils.sentences(text);
    if (!sentences.length) return 'Please add a little more detail so I can summarize it.';
    const keywords = utils.keywords(text, 6);
    const scores = sentences.map((sentence) => {
      const words = utils.words(sentence);
      const score = words.reduce((acc, word) => acc + (keywords.includes(word) ? 2 : 1), 0);
      return { sentence, score };
    });
    const highlights = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(5, scores.length))
      .map((item) => `• ${item.sentence}`)
      .join('\n');
    const followUp = keywords.slice(0, 3).map((key) => `- Review how ${key} shows up in past papers.`);
    return `Key Ideas\n${highlights}\n\nNeed-to-know terms: ${keywords.join(', ')}\n\nNext actions\n${followUp.join('\n')}`;
  },
  flashcards(text) {
    const sentences = utils.sentences(text);
    if (!sentences.length) return 'I need a sentence or two to craft flashcards.';
    const cards = [];
    sentences.forEach((sentence) => {
      const match = sentence.match(/(.+?)\s+(is|are|means|refers to|consists of)\s+(.+)/i);
      if (match) {
        cards.push({ q: match[1].trim(), a: `${match[2]} ${match[3].trim()}` });
      }
    });
    if (cards.length < 8) {
      const keywords = utils.keywords(text, 12);
      keywords.forEach((keyword) => {
        if (cards.length >= 20) return;
        const sentenceWithKeyword = sentences.find((s) => s.toLowerCase().includes(keyword));
        cards.push({
          q: `Define ${keyword}`,
          a: sentenceWithKeyword || 'Describe why this term matters in your own words.'
        });
      });
    }
    return cards
      .slice(0, 20)
      .map((card, index) => `Q${index + 1}: ${card.q}?\nA: ${card.a}`)
      .join('\n\n');
  },
  quizzes(text) {
    const sentences = utils.sentences(text);
    if (!sentences.length) return 'Add more context to build a quiz.';
    const buildQuestion = (sentence, prefix) => `${prefix}: ${sentence.replace(/[.!?]+$/, '')}?`;
    const short = sentences.slice(0, 5).map((s) => buildQuestion(s, 'Short answer'));
    const medium = sentences.slice(5, 8).map((s) => buildQuestion(s, 'Medium response'));
    const long = sentences.slice(8, 10).map((s) => buildQuestion(s, 'Long response'));
    const answers = sentences.slice(0, 10).map((s, idx) => `${idx + 1}. ${s}`);
    return [...short, ...medium, ...long, '', 'Answer guide', ...answers].join('\n');
  },
  study(text) {
    const keywords = utils.keywords(text, 5);
    const sentences = utils.sentences(text);
    return `Overview\n- Central theme: ${keywords[0] || 'Main idea'}\n- Supporting themes: ${keywords.slice(1).join(', ')}\n\nExplain it simply\n${sentences.slice(0, 3).map((s) => `- ${s}`).join('\n')}\n\nMemory hooks\n${keywords
      .map((key) => `- Link ${key} to a diagram, timeline, or case study.`)
      .join('\n')}\n\nAction steps\n- Create flashcards for the trickiest terms.\n- Teach the concept aloud for 2 minutes.\n- Attempt one past-paper question.`;
  },
  timetable(text) {
    const keywords = utils.keywords(text, 6);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sessions = days.map((day, idx) => {
      const focus = keywords[idx % keywords.length] || 'Review';
      return `${day}: 45 min on ${focus}, 10-min recap, log questions for tutor.`;
    });
    return `Week-at-a-glance\n${sessions.join('\n')}\n\nReminders\n- Space sessions 24h apart for better retention.\n- Finish each block with a self-check quiz.\n- Sundays = reflection + planning.`;
  },
  mindmap(text) {
    const keywords = utils.keywords(text, 6);
    const center = keywords[0] || 'Main Topic';
    const branches = keywords.slice(1).map((word, idx) => `├─ Branch ${idx + 1}: ${word}`);
    const details = utils
      .sentences(text)
      .slice(0, 4)
      .map((sentence, idx) => `│   ↳ Detail ${idx + 1}: ${sentence}`);
    return `Central idea: ${center}\n${branches.join('\n')}\n${details.join('\n')}\n└─ Export to canvas to keep expanding.`;
  },
  tutor(text) {
    const keywords = utils.keywords(text, 4);
    const question = keywords[0] || 'the main concept';
    return `Tutor kickoff\nYou: "I'm stuck on ${question}."\nTutor: "Let's break it down. What do you already know about it?"\nYou: "${keywords.slice(1).join(', ') || 'I know a few definitions.'}"\nTutor: "Great! Try explaining it using a real-world example."\nFollow-up prompts\n- "Can you quiz me on the tricky bits?"\n- "Help me connect this to another topic."\n- "Give me a memory trick."`;
  }
};

const modeLabels = {
  summary: 'Summary',
  flashcards: 'Flashcards',
  quizzes: 'Quiz',
  study: 'Study Guide',
  timetable: 'Revision Timetable',
  mindmap: 'Mind Map',
  tutor: 'AI Tutor'
};

const appState = {
  plan: 'free',
  conversions: 0,
  limit: 3,
  mode: 'summary',
  lastOutput: '',
  lastText: ''
};

const noteInput = document.getElementById('noteInput');
const noteStats = document.getElementById('noteStats');
const conversionInfo = document.getElementById('conversionInfo');
const appNotice = document.getElementById('appNotice');
const planDescription = document.getElementById('planDescription');
const planSwitchButtons = document.querySelectorAll('.plan-btn');
const planCTAButtons = document.querySelectorAll('.plan-card [data-plan]');
const modeButtons = document.querySelectorAll('#modeButtons .mode-btn');
const previewEl = document.getElementById('modePreview');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyResult');
const downloadBtn = document.getElementById('downloadResult');
const regenerateBtn = document.getElementById('regenerate');
const resultBody = document.getElementById('resultBody');
const resultTitle = document.getElementById('resultTitle');
const resultMode = document.getElementById('resultMode');
const fileUpload = document.getElementById('textUpload');
const sampleBtn = document.getElementById('sampleBtn');
const focusBtn = document.getElementById('focusInput');
const clearBtn = document.getElementById('clearInput');
const actionCards = document.querySelectorAll('.action-card');

const updateStats = () => {
  const text = noteInput.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  noteStats.textContent = `${words} words • ${text.length} characters`;
};

const updateConversionInfo = () => {
  if (appState.plan === 'plus') {
    conversionInfo.textContent = 'Plus plan • unlimited conversions';
    return;
  }
  const remaining = Math.max(appState.limit - appState.conversions, 0);
  conversionInfo.textContent = `Free plan • ${remaining} conversions left today`;
};

const showNotice = (message, tone = 'info') => {
  appNotice.textContent = message;
  appNotice.style.color = tone === 'error' ? '#ffbdbd' : 'var(--mint)';
};

const setPlan = (plan) => {
  appState.plan = plan;
  planSwitchButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.plan === plan);
  });
  planDescription.textContent =
    plan === 'plus'
      ? 'Plus unlocks unlimited conversions, premium outputs, and tutor support.'
      : 'Free plan includes summaries, flashcards, quizzes, and study guides.';
  if (plan === 'plus') {
    showNotice('Plus activated — premium modes unlocked!');
  } else {
    showNotice('Back on Free plan. Premium outputs will be locked again.');
  }
  updateConversionInfo();
};

const setMode = (mode) => {
  appState.mode = mode;
  modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
  const meta = modeMeta[mode];
  previewEl.innerHTML = `
    <h3>${meta.title}</h3>
    <p>${meta.description}</p>
    <p class="microcopy">${premiumModes.includes(mode) ? 'Requires Plus plan.' : 'Included in Free plan.'}</p>
  `;
  resultMode.textContent = modeLabels[mode];
};

const guardAccess = () => {
  if (premiumModes.includes(appState.mode) && appState.plan !== 'plus') {
    showNotice('Upgrade to Plus to unlock this premium output.', 'error');
    return false;
  }
  if (appState.plan === 'free' && appState.conversions >= appState.limit) {
    showNotice('Free plan limit reached. Switch to Plus for unlimited conversions.', 'error');
    return false;
  }
  if (!noteInput.value.trim()) {
    showNotice('Paste or type notes first so I have something to transform.', 'error');
    return false;
  }
  return true;
};

const renderResult = (output, sourceText, isRegeneration = false) => {
  appState.lastOutput = output;
  appState.lastText = sourceText;
  resultBody.textContent = output;
  resultTitle.textContent = `${modeLabels[appState.mode]} ready to review${isRegeneration ? ' (refreshed)' : ''}.`;
};

const generate = (isRegeneration = false) => {
  if (!isRegeneration && !guardAccess()) return;
  if (isRegeneration && !appState.lastText) {
    showNotice('Generate something first, then hit regenerate.', 'error');
    return;
  }
  const text = isRegeneration ? appState.lastText : noteInput.value.trim();
  const generator = generators[appState.mode];
  const output = generator ? generator(text) : 'Mode not found.';
  renderResult(output, text, isRegeneration);
  if (appState.plan === 'free' && !isRegeneration) {
    appState.conversions += 1;
    updateConversionInfo();
  }
  showNotice('Done! Scroll to the results card to review.');
};

noteInput.addEventListener('input', updateStats);

sampleBtn.addEventListener('click', () => {
  noteInput.value = sampleNotes.default;
  updateStats();
  showNotice('Sample biology notes loaded.');
});

focusBtn.addEventListener('click', () => {
  noteInput.focus();
  showNotice('Cursor moved into the note box.');
});

clearBtn.addEventListener('click', () => {
  noteInput.value = '';
  updateStats();
  showNotice('Input cleared. Paste fresh notes to continue.');
});

fileUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    noteInput.value = reader.result;
    updateStats();
    showNotice(`Loaded ${file.name}.`);
  };
  reader.onerror = () => showNotice('Unable to read that file. Try a plain text file.', 'error');
  reader.readAsText(file);
});

actionCards.forEach((card) => {
  card.addEventListener('click', () => {
    const sampleKey = card.dataset.sample;
    if (card.dataset.trigger === 'upload') {
      fileUpload.click();
      return;
    }
    if (sampleKey && sampleNotes[sampleKey]) {
      noteInput.value = sampleNotes[sampleKey];
      updateStats();
      showNotice(`Loaded ${sampleKey} sample.`);
    }
  });
});

planSwitchButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setPlan(btn.dataset.plan);
  });
});

planCTAButtons.forEach((btn) => {
  btn.addEventListener('click', () => setPlan(btn.dataset.plan));
});

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });
});

generateBtn.addEventListener('click', () => generate(false));
regenerateBtn.addEventListener('click', () => generate(true));

copyBtn.addEventListener('click', async () => {
  if (!appState.lastOutput) {
    showNotice('Generate something first before copying.', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(appState.lastOutput);
    showNotice('Result copied to clipboard.');
  } catch (error) {
    showNotice('Clipboard is unavailable in this browser.', 'error');
  }
});

downloadBtn.addEventListener('click', () => {
  if (!appState.lastOutput) {
    showNotice('Generate something first before downloading.', 'error');
    return;
  }
  const blob = new Blob([appState.lastOutput], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${modeLabels[appState.mode].replace(/\s+/g, '-').toLowerCase()}-notepalooza.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotice('Download started.');
});

setMode(appState.mode);
updateStats();
updateConversionInfo();
showNotice('Ready when you are. Paste notes and press generate.');
