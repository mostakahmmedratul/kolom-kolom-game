import React, { useState } from 'react';
import JSZip from 'jszip';
import { JAVA_PROJECT_FILES, JavaSourceFile } from '../data/javaProjectFiles';
import { X, Download, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const JavaProjectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<JavaSourceFile>(JAVA_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'CODE' | 'CLI'>('CODE');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('kolom-kolom-desktop');

      // Add all project files
      JAVA_PROJECT_FILES.forEach(file => {
        folder?.file(file.path, file.content);
      });

      // Add README and packaging scripts
      folder?.file(
        'README.md',
        `# Kolom Kolom — Realistic Java Desktop Game\n\nRun with:\nmvn clean compile exec:java\n\nRun Tests:\nmvn test\n`
      );

      folder?.file(
        'package-mac.sh',
        `#!/usr/bin/env bash\nmvn clean package -DskipTests\njpackage --input target/ --name "KolomKolom" --main-jar "kolom-kolom.jar" --main-class "com.kolomkolom.Main" --type dmg --dest dist/\n`
      );

      folder?.file(
        'package-win.bat',
        `@echo off\ncall mvn clean package -DskipTests\njpackage --input target\\ --name "KolomKolom" --main-jar "kolom-kolom.jar" --main-class "com.kolomkolom.Main" --type msi --dest dist\\\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kolom-kolom-desktop.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Java 21 Desktop Architecture & Project Source
              </h2>
              <p className="text-xs text-stone-400">
                Custom 2D rigid-body physics, Java2D graphics, Swing UI & JUnit 5 tests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Archiving...' : 'Download Project (.ZIP)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-6 py-2 border-b border-stone-800 bg-stone-900/50 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('CODE')}
            className={`text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CODE' ? 'border-amber-400 text-amber-300' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Source Code Explorer ({JAVA_PROJECT_FILES.length} Files)
          </button>
          <button
            onClick={() => setActiveTab('CLI')}
            className={`text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CLI' ? 'border-amber-400 text-amber-300' : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Build & Packaging Commands (macOS & Windows)
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'CODE' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar file list */}
            <div className="w-72 border-r border-stone-800 bg-stone-950/50 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-2 py-1">
                Project Files
              </div>
              {JAVA_PROJECT_FILES.map(file => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                    }`}
                  >
                    <span className="truncate">{file.path.split('/').pop()}</span>
                    <span className="text-[10px] text-stone-500 uppercase shrink-0 ml-2">
                      {file.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Code viewer */}
            <div className="flex-1 flex flex-col bg-stone-950 overflow-hidden">
              <div className="px-4 py-2 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-300 font-medium">{selectedFile.path}</span>
                  <span className="text-[11px] text-stone-500">· {selectedFile.description}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-stone-300 leading-relaxed bg-[#0d0f12]">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-stone-950 text-stone-300">
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <span>Running on macOS (Apple Silicon M1/M2/M3/M4 & Intel)</span>
              </h3>
              <p className="text-xs text-stone-400 mb-3">
                Ensure JDK 21 is installed (e.g., <code className="text-amber-300">brew install openjdk@21</code>):
              </p>
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-2">
                <div># 1. Compile project</div>
                <div className="text-white">mvn clean compile</div>
                <div className="pt-2"># 2. Run all deterministic JUnit 5 physics and rules tests</div>
                <div className="text-white">mvn test</div>
                <div className="pt-2"># 3. Launch game window</div>
                <div className="text-white">mvn exec:java</div>
                <div className="pt-2"># 4. Package native macOS .dmg installer with jpackage</div>
                <div className="text-white">./package-mac.sh</div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <span>Running on Windows (Windows 10 & 11)</span>
              </h3>
              <p className="text-xs text-stone-400 mb-3">
                Ensure Java 21 JDK is installed and Maven is in PATH:
              </p>
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 font-mono text-xs text-sky-300 space-y-2">
                <div>REM 1. Compile and test</div>
                <div className="text-white">mvn clean test</div>
                <div className="pt-2">REM 2. Run game directly</div>
                <div className="text-white">mvn exec:java</div>
                <div className="pt-2">REM 3. Package Windows standalone MSI installer</div>
                <div className="text-white">package-win.bat</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Tested & Deterministic:</strong> The Java physics engine does not depend on any third-party physics library. All segment distance math, angular momentum torque, friction damping, and capsule collision response are implemented in clean, pure Java 21 with 100% offline self-contained operation.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
