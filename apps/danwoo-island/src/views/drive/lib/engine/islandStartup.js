export const STARTUP = { assets: 'assets', graphics: 'graphics', ready: 'ready', error: 'error' }
const status = document.createElement('div')
status.className = 'island-startup'
status.setAttribute('role', 'status')
status.setAttribute('aria-live', 'polite')
const label = document.createElement('span')
const retry = document.createElement('button')
retry.type = 'button'
retry.textContent = '다시 불러오기'
retry.hidden = true
retry.addEventListener('click', () => location.reload())
status.append(label, retry)
document.body.append(status)
let stage = STARTUP.assets
let slowTimer

export function setStartupStage(next)
{
    stage = next
    document.documentElement.dataset.startup = next
    performance.mark(`danwoo-island:${next}`)
    const messages = {
        [STARTUP.assets]: '풍경을 불러오고 있어요',
        [STARTUP.graphics]: '화면과 움직임을 준비하고 있어요',
        [STARTUP.ready]: '',
        [STARTUP.error]: '준비를 마치지 못했어요',
    }
    label.textContent = messages[next]
    status.hidden = next === STARTUP.ready
    if(next === STARTUP.ready || next === STARTUP.error)
        clearTimeout(slowTimer)
    retry.hidden = next !== STARTUP.error
    if(next === STARTUP.error)
        window.dispatchEvent(new CustomEvent('danwoo-island:error', { detail: { code: 'STARTUP_FAILED' } }))
}

setStartupStage(STARTUP.assets)
slowTimer = setTimeout(() =>
{
    if(stage === STARTUP.ready || stage === STARTUP.error)
        return
    label.textContent = '준비가 조금 오래 걸리고 있어요'
    retry.hidden = false
}, 12000)
