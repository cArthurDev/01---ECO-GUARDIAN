

let videoOverlay = null;

export function playVideo(videoPath, onComplete) {
  return new Promise((resolve) => {
    if (videoOverlay) {
      videoOverlay.remove();
    }

    videoOverlay = document.createElement('div');
    videoOverlay.id = 'video-overlay';
    videoOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      overflow: hidden;
    `;

    const video = document.createElement('video');
    video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    video.controls = false;
    video.autoplay = true;
    video.src = videoPath;

    let finished = false;
    const finishPlayback = () => {
      if (finished) return;
      finished = true;

      video.pause();
      if (videoOverlay) {
        videoOverlay.remove();
        videoOverlay = null;
      }

      if (onComplete) onComplete();
      resolve();
    };

    const skipButton = document.createElement('button');
    skipButton.type = 'button';
    skipButton.style.cssText = `
      position: absolute;
      right: 24px;
      bottom: 24px;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      z-index: 2;
    `;
    const skipImage = document.createElement('img');
    skipImage.src = './images/botões/BOTAO_PULAR.png';
    skipImage.alt = 'Pular';
    skipImage.style.cssText = `
      display: block;
      width: min(22vw, 240px);
      height: auto;
      user-select: none;
      pointer-events: none;
    `;
    skipButton.appendChild(skipImage);
    skipButton.addEventListener('click', finishPlayback);

    video.addEventListener('ended', () => {
      finishPlayback();
    });

    videoOverlay.appendChild(video);
    videoOverlay.appendChild(skipButton);
    document.body.appendChild(videoOverlay);

    video.play().catch((err) => {
      console.warn('Erro ao reproduzir vídeo:', err);
      finishPlayback();
    });
  });
}

export function stopVideo() {
  if (videoOverlay) {
    videoOverlay.remove();
    videoOverlay = null;
  }
}
