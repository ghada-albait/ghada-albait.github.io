import asyncio, json, sys, subprocess, time, re
from playwright.async_api import async_playwright
REPO='/home/claude/ghada-albait.github.io'
srv=subprocess.Popen(['python3','-m','http.server','8765','-d',REPO],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
URL='http://localhost:8765/'
store={}
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,service_workers='block')
    async def route(r):
        name=r.request.url.rsplit('/',1)[1].split('?')[0]
        await r.fulfill(path='/home/claude/ghada-albait.github.io/tests/e2e/mock/'+name, content_type='application/javascript')
    await ctx.route('https://www.gstatic.com/firebasejs/**', route)
    pg=await ctx.new_page()
    errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console:'+m.text) if m.type=='error' else None)
    await pg.goto(URL); await pg.wait_for_timeout(500)
    cur={'u':None}
    async def as_user(u):
        if cur['u']:
            store[cur['u']]=await pg.evaluate("()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=='mockDB')o[k]=localStorage.getItem(k)}return o}")
        await pg.evaluate("(a)=>{const db=localStorage.getItem('mockDB');localStorage.clear();if(db)localStorage.setItem('mockDB',db);for(const[k,v]of Object.entries(a.s))localStorage.setItem(k,v);localStorage.setItem('mockUid',a.u)}", {'u':u,'s':store.get(u,{})})
        cur['u']=u; await pg.reload(); await pg.wait_for_timeout(900)
    async def click(sel, n=0):
        await pg.locator(sel).nth(n).click(); await pg.wait_for_timeout(350)
    async def shot(n): await pg.screenshot(path=f'/tmp/e2e_{n}.png', full_page=False)
    async def goset():
        await pg.evaluate("()=>document.getElementById('modal').click()"); await pg.wait_for_timeout(200)
        await click('.nav button >> nth=-1'); await click('[data-act="atab"][data-v="set"]')
    async def setpin(role,pin):
        await pg.evaluate('''async (a)=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('TEST|'+a.r+'|'+a.p));const h=[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');const db=JSON.parse(localStorage.getItem('mockDB'));db['households/TEST/secret/pins'][a.r]=h;db['households/TEST'].pinSet[a.r]=true;localStorage.setItem('mockDB',JSON.stringify(db))}''',{'r':role,'p':pin})
        await pg.reload(); await pg.wait_for_timeout(900)
    db=lambda: pg.evaluate("()=>JSON.parse(localStorage.getItem('mockDB')||'{}')")
    T=sys.argv[1] if len(sys.argv)>1 else ''
    # 1 admin creates house
    await as_user('admin1')
    await click('[data-act="goCreate"]')
    await pg.fill('#hname','بيت التجربة'); await pg.fill('#hcode','TEST'); await pg.fill('#apin','111111'); await pg.fill('#apin2','111111')
    await click('[data-act="create"]'); await pg.wait_for_timeout(1500)
    # close any modal
    for i in range(3):
        if await pg.locator('#modal.show, #modal.open').count(): await pg.keyboard.press('Escape')
    await pg.evaluate("()=>{const m=document.getElementById('modal'); if(m) m.click()}"); await pg.wait_for_timeout(300)
    await goset()
    await pg.wait_for_timeout(400)
    await shot('01_settings')
    # add person Maria (driver+maid, fil)
    await click('[data-act="person"]')
    await pg.fill('[data-m="name"]','Maria')
    await click('[data-act="personRole"][data-v="driver"]'); await click('[data-act="personRole"][data-v="maid"]'); await click('[data-act="personLang"][data-v="fil"]')
    await shot('02_person_modal')
    await click('[data-act="savePerson"]') if await pg.locator('[data-act="savePerson"]').count() else await click('#sheet .save, #sheet button.block >> nth=-1')
    await pg.wait_for_timeout(1200)
    await shot('03_invite')
    txt=await pg.locator('#sheet').inner_text()
    mpin=re.search(r'(\d{6})',txt).group(1); print('maria pin',mpin)
    await pg.evaluate("()=>document.getElementById('modal').click()"); await pg.wait_for_timeout(300)
    # add Ravi cook te
    await click('[data-act="person"]'); await pg.fill('[data-m="name"]','Ravi'); await click('[data-act="personRole"][data-v="cook"]'); await click('[data-act="personLang"][data-v="te"]')
    await click('[data-act="savePerson"]'); await pg.wait_for_timeout(1200)
    await pg.evaluate("()=>document.getElementById('modal').click()"); await pg.wait_for_timeout(300)
    # shared cook pin 1234
    await setpin('cook','1234')
    # 2 cook logs in with shared pin
    await as_user('cook1')
    await pg.fill('#code','TEST'); await pg.fill('#pin','1234'); await click('[data-act="login"]'); await pg.wait_for_timeout(1500)
    await pg.evaluate("()=>{localStorage.setItem('myName_TEST','Ravi R')}")
    await pg.reload(); await pg.wait_for_timeout(1200)
    d=await db(); print('cook member', d.get('households/TEST/members/cook1'))
    # 3 maria logs in with personal pin
    await as_user('maid1')
    await click('[data-act="setLang"][data-v="fil"]')
    await pg.fill('#code','TEST'); await pg.fill('#pin',mpin); await click('[data-act="login"]'); await pg.wait_for_timeout(1800)
    await pg.evaluate("()=>document.getElementById('modal').click()"); await pg.wait_for_timeout(400)
    d=await db(); print('maria member', d.get('households/TEST/members/maid1'))
    await shot('04_maria_driver')
    await click('a.roleswitch'); await pg.wait_for_timeout(400); await shot('05_me_switch')
    await click('[data-act="switchRole"][data-v="maid"]'); await pg.wait_for_timeout(1500)
    await pg.evaluate("()=>document.getElementById('modal').click()"); await pg.wait_for_timeout(400)
    await shot('06_maid_view')
    # add shortage
    await click('[data-act="addShort"]'); await pg.wait_for_timeout(400)
    await click('[data-act="pickItem"][data-id="bleach"]'); await pg.wait_for_timeout(300)
    await click('[data-act="saveShort"]'); await pg.wait_for_timeout(800)
    await shot('07_maid_added')
    d=await db(); sh=[v for k,v in d.items() if '/shortages/' in k]; print('shortages', sh)
    # 4 admin: link cook device, message to Maria
    await as_user('admin1')
    await goset(); await pg.wait_for_timeout(500)
    await shot('08_admin_people')
    await click('[data-act="linkDev"][data-id="cook1"]'); await pg.wait_for_timeout(300); await shot('09_link_modal')
    await pg.locator('[data-act="linkTo"]', has_text='Ravi').click(); await pg.wait_for_timeout(800)
    d=await db(); print('cook after link', d.get('households/TEST/members/cook1'))
    await click('[data-act="atab"][data-v="inbox"]'); await click('[data-act="newAdminMsg"]')
    await shot('10_msg_to')
    await click('[data-act="amTo"][data-v^="p:"]'); await pg.fill('[data-m="text"]','نظفي المطبخ'); await click('[data-act="sendAdminMsg"]'); await pg.wait_for_timeout(700)
    d=await db(); print('msgs', [v for k,v in d.items() if '/messages/' in k])
    # shortages view admin shows byName
    await click('[data-act="atab"][data-v="short"]'); await shot('11_admin_short')
    # 5 maria sees message
    await as_user('maid1'); await pg.wait_for_timeout(600)
    await click('[data-act="openMsgs"]'); await pg.wait_for_timeout(500); await shot('12_maria_msgs')
    # 6 admin: legacy off (cook linked; create unlinked family via shared pin first)
    await as_user('admin1'); await goset()
    await setpin('family','5555')
    await as_user('fam1'); await pg.fill('#code','TEST'); await pg.fill('#pin','5555'); await click('[data-act="login"]'); await pg.wait_for_timeout(1200)
    await as_user('admin1'); await goset(); await pg.wait_for_timeout(400)
    await click('[data-act="legacyOff"]'); await shot('13_legacy_confirm'); await click('[data-act="legacyOff"]'); await pg.wait_for_timeout(800)
    d=await db(); print('members after legacyOff', sorted(k.split('/')[-1] for k in d if '/members/' in k), 'pins keys', list(d['households/TEST/secret/pins'].keys()), 'pinSet', d['households/TEST'].get('pinSet'))
    await shot('14_after_legacy')
    # login with old cook pin must fail
    await as_user('cook2'); await pg.fill('#code','TEST'); await pg.fill('#pin','1234'); await click('[data-act="login"]'); await pg.wait_for_timeout(1500)
    d=await db(); print('cook2 member (should be none):', d.get('households/TEST/members/cook2'))
    # 7 delete Ravi
    await as_user('admin1'); await goset(); await pg.wait_for_timeout(300)
    await pg.locator('[data-act="person"][data-id]').nth(1).click(); await pg.wait_for_timeout(300)
    await click('[data-act="delPerson"]'); await click('[data-act="delPerson"]'); await pg.wait_for_timeout(800)
    d=await db(); print('after delete Ravi: members', sorted(k.split('/')[-1] for k in d if '/members/' in k), 'people', [v['name'] for k,v in d.items() if '/people/' in k], 'logins', len([k for k in d if '/logins/' in k]))
    await as_user('cook1'); await pg.wait_for_timeout(800); print('cook1 view login?', await pg.locator('#pin').count())
    print('ERRORS', [e for e in errs if 'ERR_TUNNEL' not in e and 'ERR_' not in e][:10])
    await b.close()
asyncio.run(main()); srv.terminate()
