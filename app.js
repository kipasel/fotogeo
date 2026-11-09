/**
 * Foto GPS — Kamera Geotag & Watermark Lapangan
 * Modern Web & PWA Geolocation Camera Engine
 */

// ========================================================
// STATE MANAGEMENT & SETTINGS
// ========================================================
const DEFAULT_SETTINGS = {
  instansiName: 'KIP KABUPATEN ACEH SELATAN',
  subTitle: 'DOKUMENTASI FOTO GEO LOKASI',
  style: 'official', // 'official', 'card', 'minimal'
  coordFormat: 'both', // 'both', 'decimal', 'dms'
  showHeader: true,
  showCoords: true,
  showAddress: true,
  showTime: true,
  quality: 0.9,
  customLogoUrl: null,
};

let appSettings = { ...DEFAULT_SETTINGS };
let cameraStream = null;
let currentFacing = 'environment'; // 'environment' (belakang) or 'user' (depan)
let isTorchOn = false;
let currentAspectRatio = '4:3'; // '4:3', '16:9', '1:1'
let showGrid = true;

let gpsCoords = null;
let currentAddress = 'Menunggu pencarian alamat...';
let isGeocoding = false;
let lastGeocodedCoords = null;
let gpsWatchId = null;

let currentCapturedDataUrl = null;
let currentCapturedMeta = null;

// ========================================================
// DOM SELECTORS
// ========================================================
const $ = (id) => document.getElementById(id);

const els = {
  // Video & Viewfinder
  video: $('cameraVideo'),
  cameraBox: $('cameraBox'),
  cameraPlaceholder: $('cameraPlaceholder'),
  btnStartCamera: $('btnStartCamera'),
  viewfinderGrid: $('viewfinderGrid'),
  btnToggleGrid: $('btnToggleGrid'),
  btnToggleTorch: $('btnToggleTorch'),
  btnSwitchCamera: $('btnSwitchCamera'),
  aspectRatioPill: $('aspectRatioPill'),
  aspectRatioLabel: $('aspectRatioLabel'),
  btnCycleRatio: $('btnCycleRatio'),
  ratioBtnText: $('ratioBtnText'),
  
  // Live Overlay
  liveWmOverlay: $('liveWmOverlay'),
  liveWmInstansi: $('liveWmInstansi'),
  liveWmTime: $('liveWmTime'),
  liveWmGps: $('liveWmGps'),
  liveWmAddr: $('liveWmAddr'),
  quickNotesInput: $('quickNotesInput'),

  // Shutter & Input
  btnCapture: $('btnCapture'),
  filePicker: $('filePicker'),

  // GPS Strip
  gpsStatusStrip: $('gpsStatusStrip'),
  gpsIndicator: $('gpsIndicator'),
  gpsStatusText: $('gpsStatusText'),
  gpsCoordsText: $('gpsCoordsText'),
  btnRefreshGps: $('btnRefreshGps'),

  // Modals
  modalResult: $('modalResult'),
  btnCloseResult: $('btnCloseResult'),
  resultImage: $('resultImage'),
  resultMetaCoords: $('resultMetaCoords'),
  resultMetaTime: $('resultMetaTime'),
  resultMetaAddress: $('resultMetaAddress'),
  resultMetaNoteRow: $('resultMetaNoteRow'),
  resultMetaNote: $('resultMetaNote'),
  btnDownloadPhoto: $('btnDownloadPhoto'),
  btnSharePhoto: $('btnSharePhoto'),

  modalSettings: $('modalSettings'),
  btnOpenSettings: $('btnOpenSettings'),
  btnCloseSettings: $('btnCloseSettings'),
  btnSaveSettings: $('btnSaveSettings'),
  cfgInstansiName: $('cfgInstansiName'),
  cfgSubTitle: $('cfgSubTitle'),
  cfgStyle: $('cfgStyle'),
  cfgCoordFormat: $('cfgCoordFormat'),
  cfgShowHeader: $('cfgShowHeader'),
  cfgShowCoords: $('cfgShowCoords'),
  cfgShowAddress: $('cfgShowAddress'),
  cfgShowTime: $('cfgShowTime'),
  cfgQuality: $('cfgQuality'),
  logoInputFile: $('logoInputFile'),
  settingsLogoPreview: $('settingsLogoPreview'),
  btnResetLogo: $('btnResetLogo'),

  modalGallery: $('modalGallery'),
  btnOpenGallery: $('btnOpenGallery'),
  btnCloseGallery: $('btnCloseGallery'),
  galleryGrid: $('galleryGrid'),
  btnClearGallery: $('btnClearGallery'),
  galleryCount: $('galleryCount'),

  headerLogo: $('headerLogo'),
  headerSub: $('headerSub'),
  renderCanvas: $('renderCanvas'),
  toast: $('toast'),
  toastMessage: $('toastMessage')
};

// ========================================================
// TOAST NOTIFICATIONS
// ========================================================
let toastTimer = null;
function showToast(message, duration = 3000) {
  if (toastTimer) clearTimeout(toastTimer);
  els.toastMessage.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('show');
  }, duration);
}

// ========================================================
// LOCAL STORAGE & SETTINGS LOAD/SAVE
// ========================================================
function loadSettings() {
  try {
    const saved = localStorage.getItem('fotogps_settings');
    if (saved) {
      appSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Gagal memuat pengaturan:', e);
  }
  applySettingsToUI();
}

function saveSettings() {
  appSettings.instansiName = els.cfgInstansiName.value.trim() || DEFAULT_SETTINGS.instansiName;
  appSettings.subTitle = els.cfgSubTitle.value.trim();
  appSettings.style = els.cfgStyle.value;
  appSettings.coordFormat = els.cfgCoordFormat.value;
  appSettings.showHeader = els.cfgShowHeader.checked;
  appSettings.showCoords = els.cfgShowCoords.checked;
  appSettings.showAddress = els.cfgShowAddress.checked;
  appSettings.showTime = els.cfgShowTime.checked;
  appSettings.quality = parseFloat(els.cfgQuality.value) || 0.9;

  try {
    localStorage.setItem('fotogps_settings', JSON.stringify(appSettings));
    showToast('Pengaturan berhasil disimpan!');
  } catch (e) {
    console.warn('Gagal menyimpan pengaturan ke localStorage:', e);
  }
  applySettingsToUI();
  closeModal(els.modalSettings);
}

function applySettingsToUI() {
  els.cfgInstansiName.value = appSettings.instansiName;
  els.cfgSubTitle.value = appSettings.subTitle;
  els.cfgStyle.value = appSettings.style;
  els.cfgCoordFormat.value = appSettings.coordFormat;
  els.cfgShowHeader.checked = appSettings.showHeader;
  els.cfgShowCoords.checked = appSettings.showCoords;
  els.cfgShowAddress.checked = appSettings.showAddress;
  els.cfgShowTime.checked = appSettings.showTime;
  els.cfgQuality.value = String(appSettings.quality);

  const logoSrc = appSettings.customLogoUrl || 'logo.png';
  els.settingsLogoPreview.src = logoSrc;
  els.headerLogo.src = logoSrc;
  els.liveWmInstansi.textContent = appSettings.instansiName;
  els.headerSub.textContent = appSettings.instansiName;
}

// ========================================================
// REAL-TIME CLOCK
// ========================================================
function getFormattedDateTime(dateObj = new Date()) {
  const optionsDate = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  const strDate = new Intl.DateTimeFormat('id-ID', optionsDate).format(dateObj);

  const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const strTime = new Intl.DateTimeFormat('id-ID', optionsTime).format(dateObj) + ' WIB';

  return { strDate, strTime, full: `${strDate} • ${strTime}` };
}

function startClock() {
  function update() {
    const { full } = getFormattedDateTime();
    els.liveWmTime.textContent = full;
  }
  update();
  setInterval(update, 1000);
}

// ========================================================
// COORDINATE FORMATTING (DECIMAL & DMS)
// ========================================================
function toDMS(degrees, isLat) {
  const absolute = Math.abs(degrees);
  const deg = Math.floor(absolute);
  const minutesNotTruncated = (absolute - deg) * 60;
  const min = Math.floor(minutesNotTruncated);
  const sec = ((minutesNotTruncated - min) * 60).toFixed(1);
  const direction = isLat ? (degrees >= 0 ? 'N' : 'S') : (degrees >= 0 ? 'E' : 'W');
  return `${deg}° ${min}' ${sec}" ${direction}`;
}

function formatCoords(coords, format = appSettings.coordFormat) {
  if (!coords) return 'Menunggu koordinat...';
  const dec = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
  const dms = `${toDMS(coords.lat, true)}, ${toDMS(coords.lon, false)}`;

  if (format === 'decimal') return dec;
  if (format === 'dms') return dms;
  return `${dec} (${dms})`;
}

// ========================================================
// GEOLOCATION & REVERSE GEOCODING
// ========================================================
function initGps() {
  if (!navigator.geolocation) {
    setGpsStatus('error', 'GPS tidak didukung perangkat');
    return;
  }

  setGpsStatus('searching', 'Mencari sinyal GPS...');

  const options = {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 10000
  };

  // One-time fast check
  navigator.geolocation.getCurrentPosition(handleGpsSuccess, handleGpsError, options);

  // Continuous tracking
  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
  gpsWatchId = navigator.geolocation.watchPosition(handleGpsSuccess, handleGpsError, options);
}

function handleGpsSuccess(pos) {
  gpsCoords = {
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude
  };

  const acc = Math.round(gpsCoords.accuracy);
  setGpsStatus('locked', `Akurasi ±${acc}m`, `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lon.toFixed(5)}`);

  // Update live preview
  let gpsText = `GPS: ${formatCoords(gpsCoords, 'decimal')} (±${acc}m)`;
  if (gpsCoords.altitude !== null && gpsCoords.altitude !== undefined) {
    gpsText += ` • Alt: ${Math.round(gpsCoords.altitude)}m`;
  }
  els.liveWmGps.textContent = gpsText;

  // Trigger reverse geocoding if moved significantly
  if (!lastGeocodedCoords || calcDistance(gpsCoords.lat, gpsCoords.lon, lastGeocodedCoords.lat, lastGeocodedCoords.lon) > 0.05) {
    reverseGeocode(gpsCoords.lat, gpsCoords.lon);
  }
}

function handleGpsError(err) {
  let msg = 'Sinyal GPS lemah';
  if (err.code === 1) msg = 'Izin lokasi ditolak';
  else if (err.code === 2) msg = 'Posisi tidak tersedia';
  else if (err.code === 3) msg = 'GPS timeout';
  setGpsStatus('error', msg);
  els.liveWmGps.textContent = 'GPS: ' + msg;
}

function setGpsStatus(state, statusText, coordsText = '') {
  els.gpsIndicator.className = 'gps-indicator ' + state;
  els.gpsStatusText.textContent = statusText;
  els.gpsCoordsText.textContent = coordsText;
}

function calcDistance(lat1, lon1, lat2, lon2) {
  // Simple Euclidean approx in km for small distance threshold
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const y = (lat2 - lat1);
  return Math.sqrt(x * x + y * y) * 111;
}

async function reverseGeocode(lat, lon) {
  if (isGeocoding) return;
  isGeocoding = true;
  lastGeocodedCoords = { lat, lon };

  els.liveWmAddr.textContent = 'Lokasi: Mencari alamat...';

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'id,en' } });
    if (!res.ok) throw new Error('Nominatim offline');
    const data = await res.json();

    const a = data.address || {};
    const road = a.road || a.pedestrian || a.footway || a.path || a.residential || '';
    const village = a.village || a.suburb || a.neighbourhood || a.hamlet || '';
    const district = a.city_district || a.subdistrict || a.county || '';
    const city = a.city || a.town || a.regency || a.state_district || '';
    const state = a.state || '';

    const parts = [road, village, district, city, state].filter((p, i, arr) => p && arr.indexOf(p) === i);
    currentAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || 'Alamat tidak diketahui');

    els.liveWmAddr.textContent = 'Lokasi: ' + currentAddress;
  } catch (e) {
    console.warn('Reverse geocode gagal/offline:', e);
    currentAddress = 'Koordinat tercatat (Nama jalan offline)';
    els.liveWmAddr.textContent = 'Lokasi: ' + currentAddress;
  } finally {
    isGeocoding = false;
  }
}

// ========================================================
// CAMERA CONTROLS & STREAM
// ========================================================
async function startCamera() {
  try {
    stopCameraStream();

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: currentFacing },
        width: { ideal: 3840 },
        height: { ideal: 2160 }
      }
    };

    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    els.video.srcObject = cameraStream;
    els.video.play();

    els.cameraPlaceholder.style.display = 'none';
    els.btnCapture.disabled = false;

    // Check torch capability
    const track = cameraStream.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        els.btnToggleTorch.style.display = 'flex';
      } else {
        els.btnToggleTorch.style.display = 'none';
      }
    }

    showToast('Kamera siap');
  } catch (err) {
    console.error('Gagal membuka kamera:', err);
    els.cameraPlaceholder.style.display = 'flex';
    els.btnCapture.disabled = true;
    alert('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan di browser Anda. Detail: ' + err.message);
  }
}

function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
}

async function toggleTorch() {
  if (!cameraStream) return;
  const track = cameraStream.getVideoTracks()[0];
  if (!track) return;

  try {
    isTorchOn = !isTorchOn;
    await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
    els.btnToggleTorch.classList.toggle('active', isTorchOn);
  } catch (e) {
    console.warn('Gagal mengatur senter:', e);
  }
}

function switchCamera() {
  currentFacing = currentFacing === 'environment' ? 'user' : 'environment';
  isTorchOn = false;
  els.btnToggleTorch.classList.remove('active');
  startCamera();
}

function cycleAspectRatio() {
  const ratios = ['4:3', '16:9', '1:1'];
  let idx = ratios.indexOf(currentAspectRatio);
  idx = (idx + 1) % ratios.length;
  currentAspectRatio = ratios[idx];

  els.aspectRatioLabel.textContent = currentAspectRatio;
  els.ratioBtnText.textContent = currentAspectRatio;

  els.cameraBox.classList.remove('ratio-16-9', 'ratio-1-1');
  if (currentAspectRatio === '16:9') els.cameraBox.classList.add('ratio-16-9');
  else if (currentAspectRatio === '1:1') els.cameraBox.classList.add('ratio-1-1');

  showToast(`Rasio foto: ${currentAspectRatio}`);
}

function toggleGrid() {
  showGrid = !showGrid;
  els.viewfinderGrid.style.display = showGrid ? 'grid' : 'none';
  els.btnToggleGrid.classList.toggle('active', showGrid);
}

// ========================================================
// WATERMARK DRAWING ENGINE (CANVAS)
// ========================================================
async function loadLogoImage() {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = appSettings.customLogoUrl || 'logo.png';
  return new Promise((resolve) => {
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

async function renderWatermarkedPhoto(sourceElement, customNote = '') {
  const canvas = els.renderCanvas;
  const ctx = canvas.getContext('2d');

  // 1. Determine Source Dimensions
  let srcW, srcH;
  if (sourceElement instanceof HTMLVideoElement) {
    srcW = sourceElement.videoWidth;
    srcH = sourceElement.videoHeight;
    if (!srcW || !srcH) throw new Error('Video kamera belum siap');
  } else {
    srcW = sourceElement.naturalWidth || sourceElement.width;
    srcH = sourceElement.naturalHeight || sourceElement.height;
  }

  // 2. Crop according to selected aspect ratio
  let targetRatio = 4 / 3;
  if (currentAspectRatio === '16:9') targetRatio = 16 / 9;
  else if (currentAspectRatio === '1:1') targetRatio = 1;

  // Check orientation
  const isPortrait = srcH > srcW;
  const effectiveRatio = isPortrait ? 1 / targetRatio : targetRatio;

  let cropW = srcW;
  let cropH = srcH;
  let cropX = 0;
  let cropY = 0;

  if (srcW / srcH > effectiveRatio) {
    cropW = Math.round(srcH * effectiveRatio);
    cropX = Math.round((srcW - cropW) / 2);
  } else if (srcW / srcH < effectiveRatio) {
    cropH = Math.round(srcW / effectiveRatio);
    cropY = Math.round((srcH - cropH) / 2);
  }

  // 3. Set Canvas Output Size (Max 2560px for high definition)
  const maxDim = 2560;
  const scale = Math.min(1, maxDim / Math.max(cropW, cropH));
  canvas.width = Math.round(cropW * scale);
  canvas.height = Math.round(cropH * scale);

  // 4. Draw Base Image
  ctx.drawImage(sourceElement, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

  // 5. Preparation for Watermark Graphics
  const W = canvas.width;
  const H = canvas.height;
  const s = Math.max(1, W / 1200); // Dynamic responsive scale factor

  const logoImg = appSettings.showHeader ? await loadLogoImage() : null;
  const { strDate, strTime } = getFormattedDateTime();
  const noteText = customNote || els.quickNotesInput.value.trim();

  // 6. Draw Top Agency Header Bar (if enabled & style is 'official')
  if (appSettings.showHeader && appSettings.style === 'official') {
    const barPad = Math.round(18 * s);
    const logoH = Math.round(H * 0.075);
    const logoW = logoImg ? Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight)) : 0;

    let titleFs = Math.max(13, Math.round(W * 0.022));
    ctx.font = `800 ${titleFs}px system-ui, sans-serif`;

    const maxTitleW = W - barPad * 2 - logoW - 20 * s;
    while (ctx.measureText(appSettings.instansiName).width > maxTitleW && titleFs > 11) {
      titleFs--;
      ctx.font = `800 ${titleFs}px system-ui, sans-serif`;
    }

    const subFs = Math.max(10, Math.round(titleFs * 0.72));
    const barH = Math.max(logoH + barPad * 1.5, Math.round((titleFs + subFs) * 1.8 + barPad * 1.5));

    // Semi-transparent dark background
    ctx.fillStyle = 'rgba(7, 14, 11, 0.88)';
    ctx.fillRect(0, 0, W, barH);

    // Elegant gold border line
    ctx.fillStyle = '#e2ba56';
    ctx.fillRect(0, barH - Math.round(4 * s), W, Math.round(4 * s));

    // Draw Logo
    if (logoImg) {
      const lx = barPad;
      const ly = Math.round((barH - logoH) / 2);
      // Small white backing for logo contrast
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(lx - 4 * s, ly - 4 * s, logoW + 8 * s, logoH + 8 * s, 6 * s);
      ctx.fill();
      ctx.drawImage(logoImg, lx, ly, logoW, logoH);
    }

    // Draw Title & Subtitle
    const textX = barPad + (logoImg ? logoW + 16 * s : 0);
    const centerY = barH / 2;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${titleFs}px system-ui, sans-serif`;
    ctx.fillText(appSettings.instansiName, textX, centerY - subFs * 0.6);

    ctx.fillStyle = '#e2ba56';
    ctx.font = `700 ${subFs}px system-ui, sans-serif`;
    ctx.fillText(appSettings.subTitle || 'DOKUMENTASI FOTO GEO LOKASI', textX, centerY + titleFs * 0.65);
  }

  // 7. Assemble Data Lines for the Watermark
  const lines = [];

  if (appSettings.style !== 'official' && appSettings.showHeader) {
    lines.push({ title: true, text: appSettings.instansiName.toUpperCase() });
  }

  if (appSettings.showTime) {
    lines.push({ icon: '🕒', text: `${strDate} | ${strTime}` });
  }

  if (appSettings.showCoords) {
    if (gpsCoords) {
      const formattedCoord = formatCoords(gpsCoords, appSettings.coordFormat);
      const acc = Math.round(gpsCoords.accuracy);
      let coordLine = `GPS: ${formattedCoord} (±${acc}m)`;
      if (gpsCoords.altitude !== null && gpsCoords.altitude !== undefined) {
        coordLine += ` • Alt: ${Math.round(gpsCoords.altitude)}m`;
      }
      lines.push({ icon: '📍', text: coordLine });
    } else {
      lines.push({ icon: '📍', text: 'GPS: Lokasi belum terdeteksi' });
    }
  }

  if (appSettings.showAddress) {
    lines.push({ icon: '📌', text: `LOKASI: ${currentAddress}` });
  }

  if (noteText) {
    lines.push({ icon: '📝', text: `CATATAN: ${noteText}` });
  }

  // 8. Draw Bottom Watermark Box
  const baseFs = Math.max(12, Math.round(W * 0.018));
  const lineH = Math.round(baseFs * 1.5);
  const pad = Math.round(20 * s);
  const maxTextW = W - pad * 2 - 20 * s;

  // Wrap lines that exceed canvas width
  const wrappedLines = [];
  lines.forEach((item) => {
    ctx.font = `${item.title ? '800' : '600'} ${item.title ? baseFs * 1.15 : baseFs}px system-ui, sans-serif`;
    const words = item.text.split(' ');
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const test = currentLine ? currentLine + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxTextW && currentLine) {
        wrappedLines.push({ title: item.title, text: currentLine });
        currentLine = '  ' + words[i]; // indent continuation
      } else {
        currentLine = test;
      }
    }
    if (currentLine) wrappedLines.push({ title: item.title, text: currentLine });
  });

  const boxH = Math.round(pad * 1.4 + wrappedLines.length * lineH);
  const boxY = H - boxH;

  if (appSettings.style === 'minimal') {
    // Minimalist: subtle shadow under text, no heavy background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6 * s;
    ctx.shadowOffsetX = 1 * s;
    ctx.shadowOffsetY = 1 * s;

    wrappedLines.forEach((line, idx) => {
      ctx.fillStyle = line.title ? '#e2ba56' : '#ffffff';
      ctx.font = `${line.title ? '800' : '600'} ${line.title ? baseFs * 1.15 : baseFs}px system-ui, sans-serif`;
      ctx.fillText(line.text, pad, boxY + pad * 0.8 + idx * lineH);
    });

    ctx.shadowColor = 'transparent';
  } else {
    // Official & Card style: dark glass banner with gold accent bar
    ctx.fillStyle = 'rgba(7, 14, 11, 0.88)';
    ctx.fillRect(0, boxY, W, boxH);

    // Left gold vertical accent
    ctx.fillStyle = '#e2ba56';
    ctx.fillRect(0, boxY, Math.round(6 * s), boxH);

    // Top gold subtle divider
    ctx.fillStyle = 'rgba(226, 186, 86, 0.5)';
    ctx.fillRect(0, boxY, W, Math.round(2 * s));

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    wrappedLines.forEach((line, idx) => {
      ctx.fillStyle = line.title ? '#e2ba56' : '#ffffff';
      ctx.font = `${line.title ? '800' : '500'} ${line.title ? baseFs * 1.12 : baseFs}px system-ui, sans-serif`;
      ctx.fillText(line.text, pad + 10 * s, boxY + pad * 0.7 + idx * lineH);
    });
  }

  // 9. Generate Final Data URL
  const dataUrl = canvas.toDataURL('image/jpeg', appSettings.quality);
  return {
    dataUrl,
    timestamp: new Date().toISOString(),
    coords: gpsCoords,
    address: currentAddress,
    note: noteText,
    instansi: appSettings.instansiName
  };
}

// ========================================================
// CAPTURE ACTIONS & RESULT PREVIEW
// ========================================================
async function takePhoto() {
  if (!cameraStream) {
    showToast('Kamera belum aktif!');
    return;
  }

  try {
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(50);

    els.btnCapture.disabled = true;
    showToast('Memproses foto & watermark...');

    const result = await renderWatermarkedPhoto(els.video);
    currentCapturedDataUrl = result.dataUrl;
    currentCapturedMeta = result;

    // Display result modal
    openResultModal(result);

    // Save to IndexedDB Gallery
    savePhotoToGallery(result);

  } catch (err) {
    console.error('Gagal mengambil foto:', err);
    alert('Gagal mengambil foto: ' + err.message);
  } finally {
    els.btnCapture.disabled = false;
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      try {
        showToast('Memproses foto yang diupload...');
        const result = await renderWatermarkedPhoto(img);
        currentCapturedDataUrl = result.dataUrl;
        currentCapturedMeta = result;
        openResultModal(result);
        savePhotoToGallery(result);
      } catch (err) {
        alert('Gagal memproses gambar: ' + err.message);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = ''; // reset input
}

function openResultModal(result) {
  els.resultImage.src = result.dataUrl;
  els.resultMetaCoords.textContent = result.coords ? formatCoords(result.coords, 'both') : 'Tidak ada GPS';
  
  const d = new Date(result.timestamp);
  const { full } = getFormattedDateTime(d);
  els.resultMetaTime.textContent = full;
  els.resultMetaAddress.textContent = result.address;

  if (result.note) {
    els.resultMetaNoteRow.style.display = 'flex';
    els.resultMetaNote.textContent = result.note;
  } else {
    els.resultMetaNoteRow.style.display = 'none';
  }

  openModal(els.modalResult);
}

// ========================================================
// DOWNLOAD & SHARE
// ========================================================
function generateFilename() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const tStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `FotoGPS_${dStr}_${tStr}.jpg`;
}

function downloadCurrentPhoto() {
  if (!currentCapturedDataUrl) return;
  const a = document.createElement('a');
  a.href = currentCapturedDataUrl;
  a.download = generateFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('Foto berhasil diunduh!');
}

async function shareCurrentPhoto() {
  if (!currentCapturedDataUrl) return;

  try {
    const blob = await (await fetch(currentCapturedDataUrl)).blob();
    const filename = generateFilename();
    const file = new File([blob], filename, { type: 'image/jpeg' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Foto GPS Lapangan',
        text: `Dokumentasi Geo Lokasi (${currentCapturedMeta?.address || ''})`,
        files: [file]
      });
      showToast('Berhasil dibagikan!');
    } else {
      // Fallback download
      downloadCurrentPhoto();
      showToast('Browser tidak mendukung Web Share, foto langsung diunduh.');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Share error:', err);
      downloadCurrentPhoto();
    }
  }
}

// ========================================================
// INDEXEDDB GALLERY HISTORY
// ========================================================
const DB_NAME = 'FotoGpsDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePhotoToGallery(photoData) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(photoData);
    tx.oncomplete = () => updateGalleryCount();
  } catch (e) {
    console.warn('Gagal menyimpan foto ke IndexedDB:', e);
  }
}

async function updateGalleryCount() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = () => {
      els.galleryCount.textContent = countReq.result || '0';
    };
  } catch (e) {
    console.warn('Gagal membaca jumlah galeri:', e);
  }
}

async function renderGallery() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = req.result || [];
      els.galleryGrid.innerHTML = '';

      if (items.length === 0) {
        els.galleryGrid.innerHTML = '<div class="gallery-empty">Belum ada foto yang diambil. Ambil foto menggunakan tombol shutter!</div>';
        return;
      }

      // Show newest first
      items.reverse().forEach((item) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';

        const d = new Date(item.timestamp);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        div.innerHTML = `
          <img src="${item.dataUrl}" alt="Thumbnail">
          <div class="gallery-item-time">${timeStr}</div>
        `;

        div.addEventListener('click', () => {
          currentCapturedDataUrl = item.dataUrl;
          currentCapturedMeta = item;
          closeModal(els.modalGallery);
          openResultModal(item);
        });

        els.galleryGrid.appendChild(div);
      });
    };
  } catch (e) {
    console.warn('Gagal merender galeri:', e);
  }
}

async function clearAllGallery() {
  if (!confirm('Apakah Anda yakin ingin menghapus semua foto di galeri ini?')) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => {
      showToast('Semua riwayat foto dihapus');
      renderGallery();
      updateGalleryCount();
    };
  } catch (e) {
    alert('Gagal menghapus galeri: ' + e.message);
  }
}

// ========================================================
// MODAL CONTROLS
// ========================================================
function openModal(modalEl) {
  modalEl.classList.add('open');
}

function closeModal(modalEl) {
  modalEl.classList.remove('open');
}

// ========================================================
// EVENT LISTENERS INITIALIZATION
// ========================================================
function initEventListeners() {
  // Camera & Shutter
  els.btnStartCamera.addEventListener('click', startCamera);
  els.btnCapture.addEventListener('click', takePhoto);
  els.btnSwitchCamera.addEventListener('click', switchCamera);
  els.btnToggleTorch.addEventListener('click', toggleTorch);
  els.btnToggleGrid.addEventListener('click', toggleGrid);
  els.aspectRatioPill.addEventListener('click', cycleAspectRatio);
  els.btnCycleRatio.addEventListener('click', cycleAspectRatio);
  els.filePicker.addEventListener('change', handleFileUpload);

  // GPS
  els.btnRefreshGps.addEventListener('click', () => {
    showToast('Memperbarui GPS...');
    initGps();
  });
  els.gpsStatusStrip.addEventListener('click', () => {
    initGps();
  });

  // Result Modal Actions
  els.btnCloseResult.addEventListener('click', () => closeModal(els.modalResult));
  els.btnDownloadPhoto.addEventListener('click', downloadCurrentPhoto);
  els.btnSharePhoto.addEventListener('click', shareCurrentPhoto);

  // Settings Modal Actions
  els.btnOpenSettings.addEventListener('click', () => openModal(els.modalSettings));
  els.btnCloseSettings.addEventListener('click', () => closeModal(els.modalSettings));
  els.btnSaveSettings.addEventListener('click', saveSettings);

  // Custom Logo Upload in Settings
  els.logoInputFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        appSettings.customLogoUrl = ev.target.result;
        els.settingsLogoPreview.src = appSettings.customLogoUrl;
      };
      reader.readAsDataURL(file);
    }
  });

  els.btnResetLogo.addEventListener('click', () => {
    appSettings.customLogoUrl = null;
    els.settingsLogoPreview.src = 'logo.png';
  });

  // Gallery Modal Actions
  els.btnOpenGallery.addEventListener('click', () => {
    renderGallery();
    openModal(els.modalGallery);
  });
  els.btnCloseGallery.addEventListener('click', () => closeModal(els.modalGallery));
  els.btnClearGallery.addEventListener('click', clearAllGallery);

  // Close modals when clicking backdrop
  [els.modalResult, els.modalSettings, els.modalGallery].forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Page lifecycle cleanup
  window.addEventListener('beforeunload', () => {
    stopCameraStream();
    if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
  });
}

// ========================================================
// SERVICE WORKER REGISTRATION (PWA)
// ========================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('Service Worker terdaftar:', reg.scope))
        .catch((err) => console.warn('Service Worker gagal terdaftar:', err));
    });
  }
}

// ========================================================
// APP INITIALIZATION
// ========================================================
function initApp() {
  loadSettings();
  initEventListeners();
  startClock();
  initGps();
  updateGalleryCount();
  registerServiceWorker();

  // Autostart camera if permissions were previously granted or on localhost
  if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    startCamera().catch(() => {});
  } else {
    showToast('Buka lewat HTTPS agar kamera dan GPS diizinkan penuh.');
  }
}

// Boot up
document.addEventListener('DOMContentLoaded', initApp);
