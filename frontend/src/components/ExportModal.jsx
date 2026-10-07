import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { generateMarkdownKit, generateAnkiTSV, downloadFile } from '../lib/export';
import { sounds } from '../lib/audio';

export default function ExportModal({
  isOpen,
  onClose,
  studyKit
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !studyKit) return null;

  const titleSlug = (studyKit.title || 'lecture')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  const handleDownloadMarkdown = () => {
    sounds.playTick();
    const md = generateMarkdownKit(studyKit);
    downloadFile(md, `LECTRA-${titleSlug}.md`, 'text/markdown;charset=utf-8');
  };

  const handleDownloadAnki = () => {
    sounds.playTick();
    const tsv = generateAnkiTSV(studyKit);
    downloadFile(tsv, `LECTRA-${titleSlug}-anki.txt`, 'text/tab-separated-values;charset=utf-8');
  };

  const handleDownloadJSON = () => {
    sounds.playTick();
    const jsonStr = JSON.stringify(studyKit, null, 2);
    downloadFile(jsonStr, `LECTRA-${titleSlug}.json`, 'application/json;charset=utf-8');
  };

  const handleCopyMarkdown = () => {
    sounds.playTick();
    const md = generateMarkdownKit(studyKit);
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    sounds.playTick();
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-icon" style={{ width: 30, height: 30 }}>
              <Download size={16} />
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Export Study Kit</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
            Choose your preferred study format. All exported files include timestamp links pointing straight to YouTube moments.
          </p>

          <div className="export-options-grid">
            {/* Option 1: Markdown */}
            <div className="export-card">
              <div className="export-card-icon">
                <FileText size={24} color="#10B981" />
              </div>
              <div className="export-card-content">
                <h4>Markdown Notes (.md)</h4>
                <p>Complete study kit with TL;DR, chapter breakdown, flashcards, and quizzes.</p>
              </div>
              <div className="export-card-actions">
                <button type="button" className="btn-secondary" onClick={handleCopyMarkdown}>
                  {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button type="button" className="btn-primary" onClick={handleDownloadMarkdown}>
                  <Download size={14} />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Option 2: Anki Deck */}
            <div className="export-card">
              <div className="export-card-icon">
                <Layers size={24} color="#3B82F6" />
              </div>
              <div className="export-card-content">
                <h4>Anki Flashcards (.txt)</h4>
                <p>Formatted TSV deck ready to import directly into Anki desktop or mobile.</p>
              </div>
              <div className="export-card-actions">
                <button type="button" className="btn-primary" onClick={handleDownloadAnki}>
                  <Download size={14} />
                  <span>Download Deck</span>
                </button>
              </div>
            </div>

            {/* Option 3: Full JSON */}
            <div className="export-card">
              <div className="export-card-icon">
                <Sparkles size={24} color="#F59E0B" />
              </div>
              <div className="export-card-content">
                <h4>Structured JSON</h4>
                <p>Full raw StudyKit dataset matching the official schema for custom tools or scripts.</p>
              </div>
              <div className="export-card-actions">
                <button type="button" className="btn-secondary" onClick={handleDownloadJSON}>
                  <Download size={14} />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            {/* Option 4: Printable View */}
            <div className="export-card">
              <div className="export-card-icon">
                <Printer size={24} color="#EC4899" />
              </div>
              <div className="export-card-content">
                <h4>Print / Save as PDF</h4>
                <p>Print a distraction-free paper study guide or export via browser PDF printer.</p>
              </div>
              <div className="export-card-actions">
                <button type="button" className="btn-secondary" onClick={handlePrint}>
                  <Printer size={14} />
                  <span>Print View</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
