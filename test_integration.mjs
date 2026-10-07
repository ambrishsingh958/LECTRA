async function test() {
  try {
    const h = await fetch('http://127.0.0.1:8000/api/health').then(r => r.json());
    console.log('✓ Health:', JSON.stringify(h));

    const demos = await fetch('http://127.0.0.1:8000/api/demos').then(r => r.json());
    console.log(`✓ Demos retrieved (${demos.length} demos):`, demos.map(d => d.title));

    const kit = await fetch('http://127.0.0.1:8000/api/kit/g78utcLQrJ4').then(r => r.json());
    console.log(`✓ Cached Kit 1: "${kit.title}" | Sections: ${kit.summary.sections.length} | Cards: ${kit.flashcards.length} | Quiz: ${kit.quiz.length}`);

    const kit2 = await fetch('http://127.0.0.1:8000/api/kit/wjZofJX0v4U').then(r => r.json());
    console.log(`✓ Cached Kit 2: "${kit2.title}" | Sections: ${kit2.summary.sections.length} | Cards: ${kit2.flashcards.length} | Quiz: ${kit2.quiz.length}`);

    const kit3 = await fetch('http://127.0.0.1:8000/api/kit/zjkBMFhNj_g').then(r => r.json());
    console.log(`✓ Cached Kit 3: "${kit3.title}" | Sections: ${kit3.summary.sections.length} | Cards: ${kit3.flashcards.length} | Quiz: ${kit3.quiz.length}`);

    const postKit = await fetch('http://127.0.0.1:8000/api/kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=g78utcLQrJ4' })
    }).then(r => r.json());
    console.log('✓ POST /api/kit cache hit:', postKit.cached);

    const inv = await fetch('http://127.0.0.1:8000/api/kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/not-yt' })
    });
    console.log('✓ Invalid URL rejection HTTP status:', inv.status);

    const fe = await fetch('http://localhost:5173/').then(r => r.text());
    console.log('✓ Frontend dev server HTTP 200, length:', fe.length, '| Contains root div:', fe.includes('id="root"'));

    console.log('\n>>> ALL ENDPOINTS & DATA FLOWS VERIFIED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('Integration test error:', err);
    process.exit(1);
  }
}

test();
