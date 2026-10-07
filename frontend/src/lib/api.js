const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Helper to fetch from backend or localStorage cache
 */
export async function fetchStudyKit(urlOrId) {
  // Check localStorage first
  const cacheKey = `lectra_kit_${urlOrId.trim()}`;
  try {
    const local = localStorage.getItem(cacheKey);
    if (local) {
      const parsed = JSON.parse(local);
      return { ...parsed, cached: true };
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  const res = await fetch(`${API_BASE}/api/kit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: urlOrId })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network request failed' }));
    throw errorData;
  }

  const data = await res.json();
  // Save in localStorage for offline resilience
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
    if (data.video_id) {
      localStorage.setItem(`lectra_kit_${data.video_id}`, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
  return data;
}

export async function fetchKitById(videoId) {
  const cacheKey = `lectra_kit_${videoId.trim()}`;
  try {
    const local = localStorage.getItem(cacheKey);
    if (local) {
      return { ...JSON.parse(local), cached: true };
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  const res = await fetch(`${API_BASE}/api/kit/${encodeURIComponent(videoId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to retrieve study kit' }));
    throw errorData;
  }
  const data = await res.json();
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
  return data;
}

export async function fetchDemos() {
  try {
    const res = await fetch(`${API_BASE}/api/demos`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Backend demos fetch failed, using fallback list');
  }

  return [
    {
      id: "g78utcLQrJ4",
      alias: "demo-lecture-1",
      title: "Photosynthesis: Light & Dark Reactions",
      duration_label: "~7 mins",
      level: "Short / Biology",
      description: "Chloroplast anatomy, chlorophyll absorption, photolysis, ATP & Calvin cycle."
    },
    {
      id: "wjZofJX0v4U",
      alias: "demo-lecture-2",
      title: "Neural Networks: Deep Learning Fundamentals",
      duration_label: "~19 mins",
      level: "Medium / AI & ML",
      description: "Activations, weights, biases, sigmoid functions, and MNIST classification."
    },
    {
      id: "zjkBMFhNj_g",
      alias: "demo-lecture-3",
      title: "MIT 6.006: Algorithmic Thinking & Peak Finding",
      duration_label: "~51 mins",
      level: "Long / Computer Science",
      description: "1D vs 2D peak finding, asymptotic analysis, divide and conquer."
    }
  ];
}

export async function submitManualTranscript(payload) {
  const res = await fetch(`${API_BASE}/api/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to process transcript' }));
    throw errorData;
  }

  return await res.json();
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    return { status: 'offline', gemini_configured: false };
  }
  return { status: 'offline', gemini_configured: false };
}
