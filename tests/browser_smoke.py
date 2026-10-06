"""Isolated Chromium UI/component smoke tests.
Requires Python playwright and a Chromium executable. No real provider requests.
This environment blocks browser URL navigation, so HTML is injected into an
isolated document. Storage is explicitly mocked; this does not verify native
IndexedDB persistence. Run on localhost manually before a public user study.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
STORAGE = r"""(() => {
const store = () => { const m = new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}; };
Object.defineProperty(window,'localStorage',{value:store(),configurable:true});
Object.defineProperty(window,'sessionStorage',{value:store(),configurable:true});
const records=new Map();
const db={transaction:()=>{const tx={};tx.objectStore=()=>({put:p=>{records.set(p.id,structuredClone(p));setTimeout(()=>tx.oncomplete?.(),0);},delete:id=>{records.delete(id);setTimeout(()=>tx.oncomplete?.(),0);},clear:()=>{records.clear();setTimeout(()=>tx.oncomplete?.(),0);},getAll:()=>{const r={result:[...records.values()].map(x=>structuredClone(x))};setTimeout(()=>r.onsuccess?.(),0);return r;}});return tx;}};
Object.defineProperty(window,'indexedDB',{value:{open:()=>{const r={result:db};setTimeout(()=>r.onsuccess?.(),0);return r;}},configurable:true});
})();"""
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1000}, accept_downloads=True)
    errors = []
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda dialog:dialog.accept())
    page.evaluate(STORAGE)
    page.set_content((ROOT/'MemoryTrail_Part5_Preview.html').read_text(),wait_until='load')
    page.wait_for_selector('.hero')
    assert page.locator('.moment-card').count()==4
    page.screenshot(path=str(OUT/'desktop-home.png'),full_page=True)
    checks=['home renders with 12-fixture collection']
    page.locator('[data-action="example"]').first.click()
    page.wait_for_selector('.photo-card')
    assert page.locator('.photo-card h3').first.inner_text()=='The birthday wish'
    assert page.locator('.clue').count()==3
    page.screenshot(path=str(OUT/'desktop-results.png'),full_page=True)
    checks.append('deck birthday/child/red-dress search ranks intended sample first')
    page.locator('[data-action="reject"][data-id="birthday-child"]').click()
    assert page.locator('.photo-open[data-id="birthday-child"]').count()==0
    page.locator('[data-action="undo-reject"]').click()
    assert page.locator('.photo-open[data-id="birthday-child"]').count()==1
    checks.append('photo rejection and undo')
    page.locator('[data-action="certainty"]').first.click()
    assert page.locator('.clue.maybe').count()==1
    page.locator('[data-action="toggle-clue"]').first.click()
    assert page.locator('.clue.off').count()==1
    page.locator('[data-action="toggle-clue"]').first.click()
    assert page.locator('.clue.off').count()==0
    checks.append('clue uncertainty, ignore and restore')
    page.locator('.photo-open[data-id="birthday-child"]').click()
    assert page.locator('dialog').is_visible()
    page.locator('[data-action="confirm-photo"]').click()
    assert page.locator('.success-panel').is_visible()
    page.locator('[data-action="undo-confirm"]').click()
    assert not page.locator('dialog').is_visible()
    checks.append('photo confirmation and undo')
    page.locator('[data-action="new-search"]').first.click()
    page.locator('#memory-input').fill('spaceship flying past Jupiter')
    page.locator('#search-form').evaluate('(f)=>f.requestSubmit()')
    assert 'No convincing match yet' in page.locator('main').inner_text()
    checks.append('honest no-result state')
    page.locator('[data-action="test-setup"]').first.click()
    page.locator('#test-code').fill('P01')
    page.locator('#test-target').select_option('birthday-child')
    page.locator('#test-form').evaluate('(f)=>f.requestSubmit()')
    page.locator('#memory-input').fill('birthday red dress child')
    page.locator('#search-form').evaluate('(f)=>f.requestSubmit()')
    page.locator('.photo-open[data-id="birthday-child"]').click()
    page.locator('[data-action="confirm-photo"]').click()
    assert 'matches the facilitator' in page.locator('dialog').inner_text()
    page.locator('[data-action="open-insights"]').click()
    assert page.locator('.stat-card').count()==6
    assert '1 correct / 1 completed' in page.locator('main').inner_text()
    checks.append('preselected target outcome is independently checked against ID')
    with page.expect_download() as download:
        page.locator('[data-action="export-json"]').click()
    download.value.save_as(str(OUT/'component-event-log.json'))
    data=json.loads((OUT/'component-event-log.json').read_text())
    assert len(data['attempts'])>=3
    assert 'src' not in data['attempts'][-1]
    checks.append('actual JSON event-log download, without photo bytes')
    page.locator('[data-action="upload"]').first.click()
    page.locator('#photo-files').set_input_files(str(ROOT/'public/assets/birthday-child.jpg'))
    page.locator('#upload-event').fill('Family birthday')
    page.locator('[data-action="import"]').click()
    page.wait_for_selector('dialog #dialog-title')
    page.wait_for_function("document.querySelector('#dialog-title')?.textContent==='Your collection is ready to explore'")
    page.locator('[data-action="close-modal"]').first.click()
    assert page.locator('#my-count').inner_text()=='1'
    page.locator('.photo-open').first.click()
    page.locator('summary').click()
    page.locator('#edit-caption').fill('A child in a red dress next to a birthday cake.')
    page.locator('#edit-cues').fill('child, red dress, birthday cake')
    page.locator('#edit-people').fill('Riya')
    page.locator('#edit-photo-form').evaluate('(f)=>f.requestSubmit()')
    page.locator('.topnav [data-view="search"]').click()
    page.locator('#memory-input').fill('Riya in a red dress at a birthday')
    page.locator('#search-form').evaluate('(f)=>f.requestSubmit()')
    assert page.locator('.photo-card').count()==1
    checks.append('real image resize/upload + editable manual context + retrieval (mock storage)')
    page.locator('.topnav [data-view="history"]').click()
    assert page.locator('.history-row').count()>=4
    checks.append('search trail records attempts')
    page.locator('[data-action="new-search"]').count()
    page.locator('[data-action="collection"][data-collection="sample"]').click()
    page.locator('.topnav [data-view="search"]').click()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth')<=390
    page.screenshot(path=str(OUT/'mobile-home.png'),full_page=True)
    page.locator('[data-action="example"]').first.click()
    assert page.evaluate('document.documentElement.scrollWidth')<=390
    page.screenshot(path=str(OUT/'mobile-results.png'),full_page=True)
    checks.append('390-pixel mobile layout has no horizontal overflow')
    page.locator('#ai-status').click()
    assert 'not configured' in page.locator('dialog').inner_text()
    checks.append('unconfigured live AI is disclosed, not simulated')
    assert not errors,errors
    report={'checks_passed':len(checks),'checks':checks,'browser':'Chromium','environment':'isolated injected document; in-memory storage doubles; no external provider calls','page_errors':errors}
    (OUT/'browser-report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
    browser.close()
