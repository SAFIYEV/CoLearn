
export interface CertificateData {
    userName: string;
    courseTitle: string;
    modulesCount: number;
    lessonsCount: number;
    completedDate?: string;
}

export function downloadCertificateImage(
    data: CertificateData,
    labels: {
        label: string;
        title: string;
        awardedTo: string;
        forCourse: string;
        date: string;
        modules: string;
        lessons: string;
    }
) {
    const W = 1200, H = 800;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d0d1a');
    bg.addColorStop(0.4, '#1a1028');
    bg.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const border = ctx.createLinearGradient(0, 0, W, H);
    border.addColorStop(0, '#8b5cf6');
    border.addColorStop(1, '#ec4899');
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(30, 30, W - 60, H - 60);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(139,92,246,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(44, 44, W - 88, H - 88);
    ctx.stroke();

    const cornerLen = 50;
    ctx.strokeStyle = 'rgba(139,92,246,0.6)';
    ctx.lineWidth = 2;
    ([[30, 30, 1, 1], [W - 30, 30, -1, 1], [30, H - 30, 1, -1], [W - 30, H - 30, -1, -1]] as number[][]).forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + dy * cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * cornerLen, y);
        ctx.stroke();
    });

    ctx.textAlign = 'center';

    ctx.font = '64px serif';
    ctx.fillText('🏆', W / 2, 130);

    ctx.font = '700 13px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(139,92,246,0.8)';
    ctx.fillText(labels.label.toUpperCase(), W / 2, 175);

    ctx.font = '800 38px Inter, Arial, sans-serif';
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText(labels.title, W / 2, 240);

    const divGrad = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, 'rgba(139,92,246,0.5)');
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, 265);
    ctx.lineTo(W / 2 + 100, 265);
    ctx.stroke();

    ctx.font = '400 16px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(labels.awardedTo, W / 2, 310);

    ctx.font = '700 36px Inter, Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.userName, W / 2, 365);

    ctx.font = '400 16px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(labels.forCourse, W / 2, 420);

    ctx.font = '600 26px Inter, Arial, sans-serif';
    ctx.fillStyle = '#e0d0ff';
    const titleText = `«${data.courseTitle}»`;
    if (ctx.measureText(titleText).width > W - 200) {
        ctx.font = '600 20px Inter, Arial, sans-serif';
    }
    ctx.fillText(titleText, W / 2, 470);

    ctx.strokeStyle = divGrad;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, 500);
    ctx.lineTo(W / 2 + 100, 500);
    ctx.stroke();

    const statsY = 550;
    const dateStr = data.completedDate
        ? new Date(data.completedDate).toLocaleDateString()
        : new Date().toLocaleDateString();
    const stats = [
        [labels.date, dateStr],
        [labels.modules, String(data.modulesCount)],
        [labels.lessons, String(data.lessonsCount)]
    ];
    stats.forEach(([label, value], i) => {
        const x = W / 2 + (i - 1) * 200;
        ctx.font = '400 13px Inter, Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillText(label, x, statsY);
        ctx.font = '600 16px Inter, Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(value, x, statsY + 25);
    });

    ctx.font = '600 12px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(139,92,246,0.5)';
    ctx.fillText('CoLearn  •  AI-Powered Learning', W / 2, 650);

    const glow = ctx.createRadialGradient(W / 2, 400, 0, W / 2, 400, 350);
    glow.addColorStop(0, 'rgba(139,92,246,0.06)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const link = document.createElement('a');
    link.download = `CoLearn_Certificate_${data.courseTitle.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
