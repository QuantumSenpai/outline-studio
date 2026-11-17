import { ImageResponse } from 'next/og';
export const alt = 'Outline Studio — Every format. One flow. One brief becomes a report, slides and a diagram.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function SocialImage() {
  return new ImageResponse(<div style={{ display: 'flex', width: '100%', height: '100%', background: '#F7F4EE', color: '#1E2030', padding: 70, flexDirection: 'column', justifyContent: 'space-between' }}>
    <div style={{ fontSize: 32 }}>Outline Studio</div><div style={{ display: 'flex', flexDirection: 'column', fontSize: 102, letterSpacing: -5, lineHeight: 1 }}>
      <span>Every format.</span><span style={{ color: '#4338CA' }}>One flow.</span></div>
    <div style={{ display: 'flex', fontSize: 27, justifyContent: 'space-between' }}><span>One brief → report · slides · diagram</span><span>Bring your own AI key.</span></div>
  </div>, size);
}
