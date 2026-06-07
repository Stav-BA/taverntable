/**
 * PortraitPicker — Gallery / Upload / AI-generate tabs
 */

import React, { useState, useRef } from 'react';
import PortraitGallery from './PortraitGallery';

interface PortraitPickerProps {
  species?: string;
  className?: string;
  currentPortrait?: string;
  onSelect: (portrait: string) => void;
}

type Tab = 'gallery' | 'upload' | 'ai';

export default function PortraitPicker({ species, className, currentPortrait, onSelect }: PortraitPickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#2D1B00' : '#EDD9A3',
    color: active ? '#C9A227' : '#5A3E1B',
    border: '2px solid #2D1B00',
    borderBottom: active ? '2px solid #2D1B00' : '2px solid #EDD9A3',
    borderRadius: '6px 6px 0 0',
    padding: '8px 18px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 13,
    marginRight: 2,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        onSelect(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerate = () => {
    setAiGenerating(true);
    // Simulate AI generation (would call an actual API)
    setTimeout(() => {
      setAiGenerating(false);
      // Placeholder — in production, call image generation API
      alert('AI portrait generation would connect to an image generation API (e.g., DALL-E, Stable Diffusion). Placeholder selected.');
      onSelect('ai-generated-placeholder');
    }, 2000);
  };

  return (
    <div style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #2D1B00', marginBottom: 0 }}>
        <button style={tabStyle(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')}>
          🖼 Gallery
        </button>
        <button style={tabStyle(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>
          📤 Upload
        </button>
        <button style={tabStyle(activeTab === 'ai')} onClick={() => setActiveTab('ai')}>
          🤖 AI Generate
        </button>
      </div>

      <div style={{
        background: '#EDD9A3', border: '2px solid #2D1B00', borderTop: 'none',
        borderRadius: '0 6px 6px 6px', padding: 20,
      }}>
        {activeTab === 'gallery' && (
          <PortraitGallery
            species={species}
            className={className}
            onSelect={onSelect}
            selected={currentPortrait}
          />
        )}

        {activeTab === 'upload' && (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📤</div>
            <p style={{ color: '#5A3E1B', marginBottom: 20 }}>
              Upload your own portrait image. JPG, PNG, or WebP supported.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#C9A227', color: '#2D1B00',
                border: '2px solid #2D1B00', borderRadius: 6,
                padding: '12px 32px', cursor: 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 15,
                fontWeight: 700, letterSpacing: '0.04em',
              }}
            >
              Choose Image File
            </button>
            {currentPortrait?.startsWith('data:') && (
              <div style={{ marginTop: 20 }}>
                <img
                  src={currentPortrait}
                  alt="Uploaded portrait"
                  style={{
                    maxWidth: 200, maxHeight: 200,
                    border: '3px solid #C9A227', borderRadius: 8,
                  }}
                />
                <div style={{ marginTop: 8, color: '#2D5016', fontStyle: 'italic' }}>
                  ✓ Portrait uploaded
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ padding: '10px 0' }}>
            <h4 style={{ fontFamily: "'Cinzel', serif", color: '#2D1B00', margin: '0 0 12px' }}>
              AI Portrait Generator
            </h4>
            <p style={{ color: '#5A3E1B', fontSize: 14, marginBottom: 16 }}>
              Describe your character and we'll generate a portrait in the TavernTable illustrated style.
            </p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#5A3E1B', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                AUTO-FILLED FROM CHARACTER
              </div>
              <div style={{
                background: '#F4E4BC', border: '1px solid #2D1B00',
                borderRadius: 4, padding: '8px 12px',
                fontSize: 13, color: '#2D1B00',
              }}>
                {[species, className, 'D&D character'].filter(Boolean).join(', ')} — illustrated portrait, medieval fantasy, woodcut style
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#5A3E1B', fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                ADDITIONAL DESCRIPTION (optional)
              </div>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. scarred face, red hair, wearing a wolf-pelt cloak, fierce expression..."
                style={{
                  width: '100%', height: 80,
                  background: '#FFF8E7', border: '2px solid #2D1B00',
                  borderRadius: 4, padding: '8px 12px',
                  fontFamily: "'Crimson Text', serif", fontSize: 14,
                  color: '#2D1B00', resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              onClick={handleAIGenerate}
              disabled={aiGenerating}
              style={{
                background: aiGenerating ? '#8B6914' : '#C9A227',
                color: '#2D1B00',
                border: '2px solid #2D1B00', borderRadius: 6,
                padding: '10px 28px', cursor: aiGenerating ? 'wait' : 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 14,
                fontWeight: 700, letterSpacing: '0.04em',
                width: '100%',
              }}
            >
              {aiGenerating ? '🎨 Generating...' : '🎨 Generate Portrait'}
            </button>
            <p style={{ fontSize: 12, color: '#8B6914', fontStyle: 'italic', marginTop: 10, textAlign: 'center' }}>
              Uses AI image generation. Results may take up to 30 seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
