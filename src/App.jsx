import { useEffect, useState } from 'react'
import {
  ArrowRight, BadgeCheck, ClipboardList, HeartPulse, History, ImagePlus, LogOut,
  Menu, Pill, ScanLine, Search, ShieldCheck, Stethoscope, UserRound, UsersRound, X,
} from 'lucide-react'
import { PHARMACIST_DEMO } from './config'
import { readData, resetData, updateData } from './data/store'
import { isExpiryCurrent, recognizeLabel } from './lib/ocr'
import './App.css'

const pages = [
  ['/', 'Home', HeartPulse], ['/donor', 'Donor', UserRound], ['/receiver', 'Receiver', UsersRound],
  ['/pharmacist', 'Pharmacist', Stethoscope], ['/traceability', 'Traceability', History],
]
const CURRENT_DATE = new Date()

function go(path) {
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function useData() {
  const [data, setData] = useState(readData)
  useEffect(() => {
    const refresh = () => setData(readData())
    window.addEventListener('medibridge:update', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('medibridge:update', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return data
}

function App() {
  const data = useData()
  const [path, setPath] = useState(window.location.pathname)
  const [menu, setMenu] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const onHistory = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onHistory)
    return () => window.removeEventListener('popstate', onHistory)
  }, [])
  useEffect(() => {
    if (!notice) return undefined
    const timeout = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timeout)
  }, [notice])
  const active = pages.some(([item]) => item === path) ? path : '/'
  const reset = () => {
    if (window.confirm('Reset all fictional MediBridge demo data in this browser?')) {
      resetData()
      setNotice('Demo data has been reset.')
    }
  }
  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); go('/') }}><span className="brand-mark"><HeartPulse size={20} /></span><span>Medi<span>Bridge</span></span></a>
      <button className="icon-button mobile-menu" aria-label="Toggle navigation" onClick={() => setMenu(!menu)}>{menu ? <X size={19} /> : <Menu size={19} />}</button>
      <nav className={menu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">{pages.map(([href, label, Icon]) => <a key={href} href={href} className={active === href ? 'nav-link active' : 'nav-link'} onClick={(event) => { event.preventDefault(); setMenu(false); go(href) }}><Icon size={16} />{label}</a>)}</nav>
      <button className="reset-button" onClick={reset}><History size={15} /> Reset demo data</button>
    </header>
    <main>
      {active === '/' && <HomePage data={data} />}
      {active === '/donor' && <DonorPage data={data} flash={setNotice} />}
      {active === '/receiver' && <ReceiverPage data={data} flash={setNotice} />}
      {active === '/pharmacist' && <PharmacistPage data={data} flash={setNotice} />}
      {active === '/traceability' && <TraceabilityPage data={data} />}
    </main>
    <footer className="site-footer"><a className="brand footer-brand" href="/" onClick={(event) => { event.preventDefault(); go('/') }}><span className="brand-mark"><HeartPulse size={16} /></span><span>Medi<span>Bridge</span></span></a><p>Fictional demo records · No real medicines are exchanged</p><span className="footer-note"><ShieldCheck size={14} /> Prototype only</span></footer>
    {notice && <div className="toast" role="status">{notice}</div>}
  </div>
}

function Heading({ eyebrow, title, description, icon: Icon }) {
  return <div className="page-heading"><div className="heading-icon"><Icon size={20} /></div><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-copy">{description}</p></div></div>
}

function SafetyNote({ compact = false }) {
  return <aside className={compact ? 'safety-note safety-compact' : 'safety-note'}><ShieldCheck size={18} /><div><strong>Prototype, not medical or legal advice</strong><p>Demo approval does not verify authenticity, safety, storage conditions, eligibility, or legal distributability. Uncertain and restricted categories must not proceed.</p></div></aside>
}

function Status({ value }) {
  return <span className={`status-pill status-${value.toLowerCase()}`}>{value}</span>
}

function Empty({ icon: Icon, title, copy }) {
  return <div className="empty-state"><span><Icon size={21} /></span><strong>{title}</strong><p>{copy}</p></div>
}

function HomePage({ data }) {
  const count = data.listings.filter((item) => item.status === 'Approved' && item.available).length
  const roles = [
    ['Donate', 'Submit an unused medicine for professional screening.', UserRound, '/donor', 'green', 'Open donor workspace'],
    ['Request', 'Explore screened demo listings and submit a request.', UsersRound, '/receiver', 'yellow', 'Browse listings'],
    ['Review', 'Review submissions and record a demo decision.', Stethoscope, '/pharmacist', 'Open review desk'],
  ]
  return <>
    <section className="hero-section"><div className="hero-copy"><span className="hero-kicker"><i /> Screening before sharing</span><h1>Give eligible unused medicines a <em>second chance.</em></h1><p>MediBridge demonstrates how unused medicine submissions can be professionally screened and carefully tracked. No listing skips review.</p><div className="hero-actions"><button className="button button-primary" onClick={() => go('/donor')}>Submit a medicine <ArrowRight size={17} /></button><button className="button button-quiet" onClick={() => go('/receiver')}>Browse demo listings</button></div><div className="hero-proof"><ShieldCheck size={17} />Review-led, traceable, and privacy-conscious by design</div></div><div className="hero-art"><img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=85" alt="Medicine packages representing fictional demo listings" /><div className="hero-stamp"><span><BadgeCheck size={17} /></span><strong>Review first</strong><small>Then trace every step</small></div><div className="hero-count"><strong>{String(count).padStart(2, '0')}</strong><small>demo listings<br />available</small></div></div></section>
    <section className="section-block roles-section"><div className="section-title-row"><div><p className="eyebrow">THREE CLEAR ROLES</p><h2>One careful process</h2></div><p>Designed to make each step visible, without turning medicines into an open marketplace.</p></div><div className="role-grid">{roles.map(([title, copy, Icon, path, tone, action], index) => <article className={`role-card role-${tone}`} key={title}><div className="role-card-top"><span className="role-icon"><Icon size={20} /></span><span className="role-index">0{index + 1}</span></div><h3>{title}</h3><p>{copy}</p><button className="text-action" onClick={() => go(path)}>{action}<ArrowRight size={16} /></button></article>)}</div></section>
    <section className="section-block steps-section"><div className="steps-heading"><p className="eyebrow">A SIMPLE THREE-STEP FLOW</p><h2>Submit. Review. Track.</h2><p>Sample records are fictional. Real distribution requires an authorized process and local legal review.</p></div><div className="step-list">{[['01', 'Submit', 'A donor shares package details and optional label text for review.'], ['02', 'Review', 'A demo pharmacist decides whether a submission advances.'], ['03', 'Track', 'Requests and simulated transfer steps are recorded with timestamps.']].map(([n, title, copy]) => <div className="step-item" key={n}><span className="step-number">{n}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div></section>
    <SafetyNote compact />
  </>
}

function AccountForm({ role, data, onLogout }) {
  const current = data.sessions?.[role]
  const receiver = role === 'receiver'
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState({ name: '', gender: '', age: '', phone: '', address: '', username: '' })
  const [error, setError] = useState('')
  if (current) return <div className="workspace-bar"><span><i className="live-dot" /> Signed in as <strong>{current}</strong></span><button className="small-action" onClick={onLogout}><LogOut size={14} /> Sign out</button></div>
  const register = (event) => {
    event.preventDefault()
    const username = form.username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) return setError('Username must contain 3–24 letters, numbers, dots, dashes, or underscores.')
    if (!form.name.trim() || (!receiver && (!form.gender || !form.age || !form.phone.trim() || !form.address.trim()))) return setError('Complete each required field before continuing.')
    try {
      updateData((state) => {
        if (state.users.some((user) => user.role === role && user.username === username)) throw new Error('That username is already registered. Sign in instead.')
        state.users.push({ ...form, username, role, age: form.age ? Number(form.age) : null, createdAt: new Date().toISOString() })
        state.sessions[role] = username
        return state
      })
      setError('')
    } catch (registrationError) { setError(registrationError.message) }
  }
  const login = (event) => {
    event.preventDefault()
    const username = form.username.trim().toLowerCase()
    if (!data.users.some((user) => user.role === role && user.username === username)) return setError('No account found. Register or use the sample account.')
    updateData((state) => { state.sessions[role] = username; return state })
    setError('')
  }
  const quickLogin = (username) => updateData((state) => { state.sessions[role] = username; return state })
  return <div className="access-layout"><section className="access-panel"><div className="segmented-control"><button className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError('') }}>Register</button><button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError('') }}>Log in</button></div><h2>{mode === 'register' ? 'Create a demo profile' : 'Welcome back'}</h2><p className="panel-copy">Fictional information only. This prototype does not verify identity.</p><form className="form-grid" onSubmit={mode === 'register' ? register : login}>{mode === 'register' && <><label className="field field-wide">Display name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jamie Sample" /></label>{!receiver && <><label className="field">Gender<select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option></select></label><label className="field">Age<input required type="number" min="18" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="18+" /></label><label className="field">Demo phone<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Fictional only" /></label><label className="field">Demo address<input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Fictional only" /></label></>}</>}<label className="field field-wide">Username<input required autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. jamie.demo" /></label>{error && <p className="form-error field-wide" role="alert">{error}</p>}<button className="button button-primary field-wide">{mode === 'register' ? 'Create demo profile' : 'Log in'}<ArrowRight size={17} /></button></form><p className="privacy-line"><ShieldCheck size={14} /> Contact and address details stay out of public listings.</p></section><aside className="sample-access"><span className="sample-icon"><Pill size={19} /></span><p className="eyebrow">QUICK SAMPLE ACCOUNT</p><h3>Pick up where the demo begins</h3><p>{receiver ? 'Browse available listings and view a sample request.' : 'View the preloaded fictional donor submissions.'}</p><button className="button button-outline" onClick={() => quickLogin(receiver ? 'alex.demo' : 'nia.demo')}>Continue as {receiver ? 'alex.demo' : 'nia.demo'}<ArrowRight size={16} /></button><small>Sample identities and records are entirely fictional.</small></aside></div>
}

function DonorPage({ data, flash }) {
  const username = data.sessions.donor
  const [form, setForm] = useState({ name: '', batch: '', expiry: '', quantity: '', condition: '', storage: '', category: 'Over-the-counter' })
  const [photo, setPhoto] = useState('')
  const [ocrText, setOcrText] = useState('')
  const [ocrMessage, setOcrMessage] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [replyNotes, setReplyNotes] = useState({})
  const donations = data.listings.filter((item) => item.donorUsername === username)
  const requests = data.requests.filter((item) => donations.some((listing) => listing.id === item.listingId))
  const logout = () => updateData((state) => { state.sessions.donor = ''; return state })
  const imageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setOcrMessage('')
    setOcrText('')
    if (!file.type.startsWith('image/')) return setError('Choose an image file such as JPG, PNG, or WEBP.')
    try {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.src = url
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject })
      const scale = Math.min(1, 1000 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      setPhoto(canvas.toDataURL('image/jpeg', 0.72)); URL.revokeObjectURL(url)
    } catch { setError('This image could not be opened. Try another JPG or PNG file.') }
  }
  const scan = async () => {
    if (!photo) return setError('Upload a package image before starting OCR.')
    setScanning(true); setError(''); setOcrMessage(''); setProgress(0)
    try {
      const result = await recognizeLabel(photo, setProgress)
      setOcrText(result.text)
      setForm((current) => ({ ...current, name: current.name || result.fields.name, batch: current.batch || result.fields.batch, expiry: current.expiry || result.fields.expiry, quantity: current.quantity || result.fields.quantity }))
      const missing = [['name', result.fields.name], ['batch number', result.fields.batch], ['expiry date', result.fields.expiry], ['quantity', result.fields.quantity]].filter(([, value]) => !value).map(([label]) => label)
      setOcrMessage(missing.length ? `Could not identify ${missing.join(', ')}. Enter those details manually.` : 'Suggestions were added only to empty fields. Verify and edit every value.')
      if (!result.text.trim()) setError('No readable text was found. Enter details manually.')
    } catch (scanError) { setError(scanError.message || 'OCR failed. You can still enter details manually.') }
    finally { setScanning(false) }
  }
  const submit = (event) => {
    event.preventDefault(); setError('')
    if (!photo) return setError('Add a package photo before submitting.')
    if (!isExpiryCurrent(form.expiry)) return setError('Enter an unexpired date as MM/YYYY, DD/MM/YYYY, or YYYY-MM-DD.')
    if (form.category !== 'Over-the-counter') return setError('Prescription, controlled, and uncertain categories cannot proceed in this prototype.')
    updateData((state) => {
      const id = `listing-${crypto.randomUUID()}`
      state.listings.unshift({ id, donorUsername: username, ...form, name: form.name.trim(), batch: form.batch.trim(), quantity: form.quantity.trim(), status: 'Pending', available: false, rejectionReason: '', photo, createdAt: new Date().toISOString() })
      state.events.unshift({ id: crypto.randomUUID(), entityType: 'listing', entityId: id, actor: username, action: 'Submission created', from: '', to: 'Pending', at: new Date().toISOString(), note: '' })
      return state
    })
    setForm({ name: '', batch: '', expiry: '', quantity: '', condition: '', storage: '', category: 'Over-the-counter' }); setPhoto(''); setOcrText(''); setOcrMessage('')
    flash('Submission received. It is pending pharmacist review.')
  }
  const respond = (request, status) => {
    const note = (replyNotes[request.id] || '').trim()
    if (status === 'Rejected' && !note) return flash('Add a short reason before rejecting this request.')
    try {
      updateData((state) => {
        const current = state.requests.find((item) => item.id === request.id)
        const listing = state.listings.find((item) => item.id === request.listingId)
        if (!current || current.status !== 'Pending') throw new Error('This request has already changed.')
        if (status === 'Accepted') {
          if (!listing || !listing.available || listing.status !== 'Approved') throw new Error('This listing is no longer available.')
          listing.available = false
          state.requests.filter((item) => item.listingId === listing.id && item.id !== current.id && item.status === 'Pending').forEach((item) => { item.status = 'Rejected'; item.reason = 'Another request was accepted first.'; state.events.unshift({ id: crypto.randomUUID(), entityType: 'request', entityId: item.id, actor: username, action: 'Request closed', from: 'Pending', to: 'Rejected', at: new Date().toISOString(), note: item.reason }) })
        }
        current.status = status; current.reason = status === 'Rejected' ? note : ''; current.updatedAt = new Date().toISOString()
        state.events.unshift({ id: crypto.randomUUID(), entityType: 'request', entityId: current.id, actor: username, action: `Request ${status.toLowerCase()}`, from: 'Pending', to: status, at: current.updatedAt, note: current.reason })
        return state
      })
      flash(status === 'Accepted' ? 'Request accepted. The listing is reserved in this demo.' : 'Request rejected.')
    } catch (err) { flash(err.message) }
  }
  const complete = (request) => {
    try { updateData((state) => { const current = state.requests.find((item) => item.id === request.id); if (!current || current.status !== 'Accepted') throw new Error('Only accepted requests can be completed.'); current.status = 'Completed'; current.updatedAt = new Date().toISOString(); state.events.unshift({ id: crypto.randomUUID(), entityType: 'request', entityId: current.id, actor: username, action: 'Simulated transfer completed', from: 'Accepted', to: 'Completed', at: current.updatedAt, note: '' }); return state }); flash('Simulated transfer marked complete. This is not a real handover.') } catch (err) { flash(err.message) }
  }
  return <div className="page-container"><Heading eyebrow="DONOR WORKSPACE" title="Submit with care" description="Share a fictional demo submission for review. Nothing is automatically approved." icon={UserRound} /><AccountForm role="donor" data={data} onLogout={logout} />{username && <div className="donor-grid"><section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">NEW SUBMISSION</p><h2>Medicine details</h2></div><span className="panel-step">01 / 02</span></div><p className="panel-copy">All entries must be fictional. Restricted categories are blocked.</p><form className="form-grid medicine-form" onSubmit={submit}>
    <div className="field-wide"><label className="field-label" htmlFor="medicine-photo">Package image <span>Optional for OCR; required to submit</span></label><label className={photo ? 'upload-zone has-image' : 'upload-zone'} htmlFor="medicine-photo">{photo ? <img src={photo} alt="Uploaded package preview" /> : <><ImagePlus size={24} /><strong>Choose a package image</strong><small>JPG, PNG, or WEBP. Fictional packaging only.</small></>}</label><input className="visually-hidden" id="medicine-photo" type="file" accept="image/*" onChange={imageChange} />{photo && <button className="text-action image-remove" type="button" onClick={() => { setPhoto(''); setOcrText('') }}><X size={15} /> Remove image</button>}</div>
    <div className="ocr-row field-wide"><button className="button button-outline" type="button" disabled={scanning} onClick={scan}><ScanLine size={16} />{scanning ? 'Scanning image…' : 'Scan medicine image'}</button>{scanning && <div className="scan-progress"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>}<p>OCR reads visible text only. It cannot verify authenticity, storage, or safety.</p></div>
    {ocrText && <div className="ocr-result field-wide"><strong>Extracted text</strong><pre>{ocrText}</pre><small>Suggestions only. Verify and edit every value. {ocrMessage}</small></div>}
    {error && <p className="form-error field-wide" role="alert">{error}</p>}
    <label className="field field-wide">Medicine name<input required maxLength="80" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label className="field">Batch number<input required maxLength="40" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} /></label><label className="field">Expiry date<input required type="text" inputMode="numeric" maxLength="10" placeholder="MM/YYYY or DD/MM/YYYY" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></label><label className="field">Quantity<input required maxLength="40" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 12 sealed tablets" /></label><label className="field">Package condition<input required maxLength="120" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Factory sealed" /></label><label className="field field-wide">Storage information<input required maxLength="160" value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} placeholder="Fictional, not independently verified" /></label><label className="field field-wide">Medicine category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Over-the-counter</option><option>Prescription</option><option>Controlled or uncertain</option></select><small>Only OTC examples can be submitted. Local rules still apply.</small></label><button className="button button-primary field-wide">Submit for pharmacist review<ArrowRight size={17} /></button>
  </form></section><aside className="donor-side"><section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR SUBMISSIONS</p><h2>Review status</h2></div><span className="count-badge">{donations.length}</span></div>{donations.length ? <div className="compact-list">{donations.map((item) => <article className="compact-record" key={item.id}><div className="record-thumb">{item.photo ? <img src={item.photo} alt="" /> : <Pill size={19} />}</div><div className="compact-record-copy"><strong>{item.name}</strong><small>Batch {item.batch} · expires {fmtDate(item.expiry)}</small>{item.rejectionReason && <small className="reason-copy">Reason: {item.rejectionReason}</small>}</div><Status value={item.status} /></article>)}</div> : <Empty icon={ClipboardList} title="No submissions yet" copy="Your review decisions will appear here." />}</section><section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">RECEIVER REQUESTS</p><h2>Respond to requests</h2></div><span className="count-badge">{requests.length}</span></div>{requests.length ? <div className="request-stack">{requests.map((request) => { const listing = donations.find((item) => item.id === request.listingId); return <article className="request-card" key={request.id}><div className="request-card-heading"><strong>{listing?.name || 'Medicine listing'}</strong><Status value={request.status} /></div><p>Request from <strong>{request.receiverUsername}</strong> · {fmtDateTime(request.createdAt)}</p>{request.status === 'Pending' && <><label className="field">Rejection note<input value={replyNotes[request.id] || ''} onChange={(e) => setReplyNotes({ ...replyNotes, [request.id]: e.target.value })} placeholder="Required to reject" /></label><div className="button-row"><button className="button button-primary button-small" onClick={() => respond(request, 'Accepted')}>Accept</button><button className="button button-danger button-small" onClick={() => respond(request, 'Rejected')}>Reject</button></div></>}{request.status === 'Accepted' && <button className="button button-outline button-small" onClick={() => complete(request)}>Mark simulated transfer complete</button>}{request.reason && <small className="reason-copy">Note: {request.reason}</small>}</article>})}</div> : <Empty icon={UsersRound} title="No receiver requests" copy="Requests for your listings will appear here." />}</section><SafetyNote /></aside></div>}</div>
}

function ReceiverPage({ data, flash }) {
  const username = data.sessions.receiver
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const listings = data.listings.filter((item) => item.status === 'Approved' && item.available && isExpiryCurrent(item.expiry, CURRENT_DATE) && item.name.toLowerCase().includes(query.trim().toLowerCase()))
  const requests = data.requests.filter((item) => item.receiverUsername === username)
  const logout = () => updateData((state) => { state.sessions.receiver = ''; return state })
  const request = (listing) => {
    if (!username) return setError('Log in or create a fictional profile before requesting.')
    try {
      updateData((state) => {
        const current = state.listings.find((item) => item.id === listing.id)
        if (!current || current.status !== 'Approved' || !current.available || current.expiry < new Date().toISOString().slice(0, 10)) throw new Error('This listing is no longer available.')
        if (state.requests.some((item) => item.listingId === current.id && ['Pending', 'Accepted'].includes(item.status))) throw new Error('This listing already has an active request.')
        const id = `request-${crypto.randomUUID()}`; const now = new Date().toISOString()
        state.requests.unshift({ id, listingId: current.id, receiverUsername: username, status: 'Pending', reason: '', createdAt: now, updatedAt: now })
        state.events.unshift({ id: crypto.randomUUID(), entityType: 'request', entityId: id, actor: username, action: 'Request submitted', from: '', to: 'Pending', at: now, note: '' })
        return state
      })
      setError(''); flash('Request sent for donor response. This is simulated.')
    } catch (err) { setError(err.message) }
  }
  return <div className="page-container"><Heading eyebrow="RECEIVER WORKSPACE" title="Browse screened demos" description="Only approved, available, unexpired fictional listings appear here." icon={UsersRound} /><AccountForm role="receiver" data={data} onLogout={logout} /><div className="receiver-layout"><section className="listing-column"><div className="search-bar"><Search size={19} /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicine name" aria-label="Search medicine name" /><span>{listings.length} available</span></div>{error && <p className="form-error inline-error" role="alert">{error}</p>}{listings.length ? <div className="listing-grid">{listings.map((item) => <article className="listing-card" key={item.id}><div className="listing-photo">{item.photo ? <img src={item.photo} alt={`Fictional package for ${item.name}`} /> : <div className="photo-placeholder"><Pill size={30} /></div>}<span className="listing-tag">Fictional demo</span></div><div className="listing-body"><div className="listing-title"><h2>{item.name}</h2><span className="available-dot"><i /> Available</span></div><div className="listing-facts"><span><small>Expiry</small><strong>{fmtDate(item.expiry)}</strong></span><span><small>Quantity</small><strong>{item.quantity}</strong></span></div><p className="listing-detail">{item.condition} · {item.category}</p><button className="button button-primary request-button" disabled={!item.available} onClick={() => request(item)}>Submit simulated request<ArrowRight size={16} /></button><p className="listing-disclaimer">A listing is not a guarantee of eligibility or safe use.</p></div></article>)}</div> : <Empty icon={Search} title="No available matches" copy={query ? 'Try another medicine name.' : 'There are no approved, available demos right now.'} />}</section><aside className="receiver-side"><section className="content-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR ACTIVITY</p><h2>Submitted requests</h2></div><span className="count-badge">{requests.length}</span></div>{requests.length ? <div className="compact-list">{requests.map((item) => { const listing = data.listings.find((record) => record.id === item.listingId); return <article className="compact-record" key={item.id}><div className="record-thumb"><Pill size={19} /></div><div className="compact-record-copy"><strong>{listing?.name || 'Listing'}</strong><small>{fmtDateTime(item.createdAt)}</small>{item.reason && <small className="reason-copy">{item.reason}</small>}</div><Status value={item.status} /></article>})}</div> : <Empty icon={ClipboardList} title="No requests yet" copy="Your requests and their status will appear here." />}</section><SafetyNote /></aside></div></div>
}

function PharmacistPage({ data, flash }) {
  const savedUser = data.sessions.pharmacist
  const [username, setUsername] = useState(savedUser || PHARMACIST_DEMO.username)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [reasons, setReasons] = useState({})
  const pending = data.listings.filter((item) => item.status === 'Pending')
  const login = (event) => {
    event.preventDefault()
    if (username !== PHARMACIST_DEMO.username || password !== PHARMACIST_DEMO.password) return setError('Credentials do not match the public demo credentials shown here.')
    updateData((state) => { state.sessions.pharmacist = username; return state }); setPassword(''); setError(''); flash('Demo pharmacist session started.')
  }
  const logout = () => updateData((state) => { state.sessions.pharmacist = ''; return state })
  const decide = (listing, status) => {
    const reason = (reasons[listing.id] || '').trim()
    if (status === 'Rejected' && !reason) return setError(`A rejection reason is required for ${listing.name}.`)
    if (status === 'Approved' && listing.category !== 'Over-the-counter') return setError('Prescription, controlled, and uncertain categories are blocked from approval.')
    try {
      updateData((state) => {
        const current = state.listings.find((item) => item.id === listing.id)
        if (!current || current.status !== 'Pending') throw new Error('This submission has already been reviewed.')
        current.status = status; current.available = status === 'Approved' && isExpiryCurrent(current.expiry); current.rejectionReason = status === 'Rejected' ? reason : ''; current.reviewedAt = new Date().toISOString()
        state.events.unshift({ id: crypto.randomUUID(), entityType: 'listing', entityId: current.id, actor: username, action: `Submission ${status.toLowerCase()}`, from: 'Pending', to: status, at: current.reviewedAt, note: current.rejectionReason })
        return state
      })
      setError(''); flash(status === 'Approved' ? 'Simulated approval recorded. This is not a safety or legal determination.' : 'Submission rejection recorded.')
    } catch (err) { setError(err.message) }
  }
  return <div className="page-container"><Heading eyebrow="PHARMACIST REVIEW DESK" title="Review every submission" description="A demo decision is recorded for traceability. No submission is auto-approved." icon={Stethoscope} />{!savedUser ? <div className="pharmacist-login-layout"><section className="access-panel"><p className="eyebrow">DEMO REVIEWER LOGIN</p><h2>Pharmacist access</h2><p className="panel-copy">This local demo login is openly disclosed and is not production authentication.</p><form className="form-grid" onSubmit={login}><label className="field field-wide">Username<input value={username} autoComplete="username" onChange={(e) => setUsername(e.target.value)} /></label><label className="field field-wide">Password<input type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} /></label>{error && <p className="form-error field-wide" role="alert">{error}</p>}<button className="button button-primary field-wide">Open review desk<ArrowRight size={17} /></button></form></section><aside className="credential-panel"><span className="credential-icon"><ShieldCheck size={20} /></span><p className="eyebrow">PUBLIC DEMO CREDENTIALS</p><h3>For this local prototype</h3><div className="credential-row"><span>Username</span><code>{PHARMACIST_DEMO.username}</code></div><div className="credential-row"><span>Password</span><code>{PHARMACIST_DEMO.password}</code></div><small>These credentials are in frontend source and must never be reused for real systems.</small></aside></div> : <><div className="workspace-bar pharmacist-bar"><span><i className="live-dot" /> Signed in as <strong>{savedUser}</strong></span><button className="small-action" onClick={logout}><LogOut size={14} /> Sign out</button></div>{error && <p className="form-error inline-error" role="alert">{error}</p>}<section className="review-list"><div className="review-list-heading"><div><p className="eyebrow">PENDING QUEUE</p><h2>Awaiting review</h2></div><span className="count-badge">{pending.length} pending</span></div>{pending.length ? pending.map((item) => <article className="review-card" key={item.id}><div className="review-image">{item.photo ? <img src={item.photo} alt={`Package submitted for ${item.name}`} /> : <Pill size={28} />}</div><div className="review-details"><div className="review-title"><div><h3>{item.name}</h3><span className="review-subtitle">Submitted by {item.donorUsername} · {fmtDateTime(item.createdAt)}</span></div><Status value={item.status} /></div><div className="review-facts">{[['Batch', item.batch], ['Expiry', fmtDate(item.expiry)], ['Quantity', item.quantity], ['Category', item.category], ['Condition', item.condition], ['Storage (unverified)', item.storage]].map(([label, value]) => <span key={label}><small>{label}</small>{value || 'Not provided'}</span>)}</div>{item.category !== 'Over-the-counter' && <p className="warning-line"><ShieldCheck size={15} /> This category is blocked from approval here.</p>}<label className="field rejection-field">Rejection reason<input value={reasons[item.id] || ''} onChange={(e) => setReasons({ ...reasons, [item.id]: e.target.value })} placeholder="Required when rejecting" /></label><div className="button-row"><button className="button button-primary button-small" disabled={item.category !== 'Over-the-counter'} onClick={() => decide(item, 'Approved')}><BadgeCheck size={15} /> Approve</button><button className="button button-danger button-small" onClick={() => decide(item, 'Rejected')}><X size={15} /> Reject</button></div></div></article>) : <Empty icon={BadgeCheck} title="The review queue is clear" copy="New donor submissions will appear here for a manual decision." />}</section><SafetyNote /></>}</div>
}

function TraceabilityPage({ data }) {
  const counts = ['Pending', 'Accepted', 'Rejected', 'Completed'].map((status) => [status, data.requests.filter((request) => request.status === status).length])
  const names = new Map([...data.listings.map((item) => [item.id, item.name]), ...data.requests.map((item) => [item.id, `Request for ${data.listings.find((listing) => listing.id === item.listingId)?.name || 'listing'}`])])
  const events = [...data.events].sort((a, b) => new Date(b.at) - new Date(a.at))
  return <div className="page-container"><Heading eyebrow="AUDIT TRAIL" title="Every step, accounted for" description="Review and request changes are recorded with demo actors and timestamps." icon={History} /><div className="trace-summary">{counts.map(([status, count]) => <div className="trace-count" key={status}><Status value={status} /><strong>{count}</strong><small>request{count === 1 ? '' : 's'}</small></div>)}</div><section className="content-panel timeline-panel"><div className="panel-heading"><div><p className="eyebrow">SHARED ACTIVITY LOG</p><h2>Recorded demo actions</h2></div><span className="count-badge">{events.length}</span></div>{events.length ? <ol className="timeline-list">{events.map((event) => <li className="timeline-entry" key={event.id}><span className="timeline-marker"><History size={15} /></span><div className="timeline-copy"><div className="timeline-title"><strong>{event.action}</strong><Status value={event.to} /></div><p>{names.get(event.entityId) || 'Demo record'} · by <strong>{event.actor}</strong></p>{event.from && <small>{event.from} <ArrowRight size={12} /> {event.to}</small>}{event.note && <small className="reason-copy">Reason: {event.note}</small>}</div><time dateTime={event.at}>{fmtDateTime(event.at)}</time></li>)}</ol> : <Empty icon={History} title="No activity recorded" copy="Submit a demo donation or request to begin the traceability log." />}</section><div className="trace-footnote"><ShieldCheck size={16} /><p>Local fictional demo data only. Real transfer would need authorized identity, privacy, safety, legal, and custody controls.</p></div></div>
}

function fmtDate(value) {
  if (!value) return 'Not provided'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function fmtDateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown time' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

export default App