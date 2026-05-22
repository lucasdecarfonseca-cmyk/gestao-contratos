import { useRef, useEffect, useState } from 'react'
import {
  Bold, Italic, List, ListOrdered, Minus, ImagePlus,
  Save, Check, Heading2, Heading3,
} from 'lucide-react'

export default function CadernoObra({ obra, onUpdate, isAdmin }) {
  const editorRef   = useRef(null)
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // Carrega conteúdo salvo ao abrir a aba (ou trocar de obra)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = obra.caderno || ''
    }
  }, [obra.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Editor helpers ───────────────────────────────────────────────────────────

  function exec(cmd, value = null) {
    editorRef.current.focus()
    document.execCommand(cmd, false, value)
  }

  function insertImageData(dataUrl) {
    editorRef.current.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<img src="${dataUrl}" style="max-width:100%;height:auto;display:block;margin:8px 0;" /><br/>`,
    )
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = ev => insertImageData(ev.target.result)
        reader.readAsDataURL(item.getAsFile())
        break
      }
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => insertImageData(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Salvar ───────────────────────────────────────────────────────────────────

  function handleSave() {
    if (saving) return
    const html = editorRef.current.innerHTML
    setSaving(true)
    onUpdate(o => ({ ...o, caderno: html }))
    setTimeout(() => { setSaving(false); setSaved(true)  }, 600)
    setTimeout(() => { setSaved(false) },                   2600)
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  const btn = 'p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-[#1A4A6B] transition-colors'
  const sep  = <div className="w-px h-5 bg-slate-200 mx-0.5 self-center shrink-0" />

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* ── Barra de ferramentas (somente admin) ── */}
      {isAdmin && (
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-slate-50 flex-wrap">

          <button
            title="Negrito"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('bold') }}
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            title="Itálico"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('italic') }}
          >
            <Italic className="w-4 h-4" />
          </button>

          {sep}

          <button
            title="Título H2"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h2') }}
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            title="Título H3"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('formatBlock', 'h3') }}
          >
            <Heading3 className="w-4 h-4" />
          </button>

          {sep}

          <button
            title="Lista com marcadores"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }}
          >
            <List className="w-4 h-4" />
          </button>

          <button
            title="Lista numerada"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('insertOrderedList') }}
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {sep}

          <button
            title="Separador horizontal"
            className={btn}
            onMouseDown={e => { e.preventDefault(); exec('insertHorizontalRule') }}
          >
            <Minus className="w-4 h-4" />
          </button>

          {sep}

          <button
            title="Inserir Imagem"
            className={`${btn} flex items-center gap-1 text-xs font-medium px-2`}
            onMouseDown={e => { e.preventDefault(); fileInputRef.current.click() }}
          >
            <ImagePlus className="w-4 h-4" />
            Inserir Imagem
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* ── Botão Salvar ── */}
          <div className="ml-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-[#1A4A6B] hover:bg-[#153d5a] text-white disabled:opacity-60'
              }`}
            >
              {saved
                ? <><Check className="w-4 h-4" /> Salvo!</>
                : <><Save className="w-4 h-4" /> Salvar anotações</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Área de edição ── */}
      <div
        ref={editorRef}
        contentEditable={isAdmin}
        suppressContentEditableWarning
        onPaste={handlePaste}
        data-placeholder="Comece a escrever suas anotações…"
        className="caderno-editor min-h-96 p-5 text-sm leading-relaxed text-slate-800"
      />

      {/* ── Rodapé somente leitura ── */}
      {!isAdmin && (
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-400">Visualização — somente leitura</span>
        </div>
      )}
    </div>
  )
}
