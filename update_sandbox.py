import re

with open('/Users/thorarinnhjalmarsson/Documents/Antigravity/bustadurinn.is/src/pages/SandboxPage.tsx', 'r') as f:
    content = f.read()

# 1. Dummy Finance
finance_old = """const INITIAL_FINANCE = [
    { id: '1', date: '2025-01-01', description: 'Leigutekjur janúar', amount: 150000, type: 'income', category: 'Rent' },
    { id: '2', date: '2025-01-05', description: 'Orkureikningur', amount: -24500, type: 'expense', category: 'Utilities' },
    { id: '3', date: '2025-01-10', description: 'Snjómokstur', amount: -15000, type: 'expense', category: 'Maintenance' },
];"""
finance_new = """const INITIAL_FINANCE = [
    { id: '1', date: '2025-01-05', description: 'Leigutekjur vegna helgar', amount: 45000, type: 'income', category: 'Rent' },
    { id: '2', date: '2025-01-12', description: 'Nýtt gas á grillið', amount: -7500, type: 'expense', category: 'Supplies' },
    { id: '3', date: '2025-01-15', description: 'Rafmagnsreikningur', amount: -24500, type: 'expense', category: 'Utilities' },
    { id: '4', date: '2025-01-20', description: 'Framlag í hússjóð (Guðrún)', amount: 15000, type: 'income', category: 'Fund' },
];"""
content = content.replace(finance_old, finance_new)

# 2. Dummy Tasks
tasks_old = """const INITIAL_TASKS = [
    { id: '1', title: 'Skipta um ljósaperu á baði', assignee: 'Jón', status: 'todo' },
    { id: '2', title: 'Mála pallinn', assignee: 'Guðrún', status: 'in_progress' },
    { id: '3', title: 'Kauptu nýjan slökkvitæki', assignee: '', status: 'done' },
];"""
tasks_new = """const INITIAL_TASKS = [
    { id: '1', title: 'Skipta um gas á grillinu', assignee: 'Jón', status: 'todo' },
    { id: '2', title: 'Mála pallinn sunnan megin', assignee: 'Guðrún', status: 'in_progress' },
    { id: '3', title: 'Sækja nýtt WiFi box í pósthólf', assignee: 'Siggi', status: 'todo' },
    { id: '4', title: 'Ganga frá garðhúsgögnum', assignee: '', status: 'done' },
];"""
content = content.replace(tasks_old, tasks_new)

# 3. Add Sparkles import if missing
if 'Sparkles' not in content:
    content = content.replace('Users\n} from \'lucide-react\';', 'Users,\n    Sparkles\n} from \'lucide-react\';')

# 4. Component signatures
content = content.replace('const SandboxCalendar = () => {', 'const SandboxCalendar = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {')
content = content.replace('const SandboxFinance = () => {', 'const SandboxFinance = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {')
content = content.replace('const SandboxTasks = () => {', 'const SandboxTasks = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {')
content = content.replace('const SandboxUsers = () => {', 'const SandboxUsers = ({ onUnlockRequest }: { onUnlockRequest: (feature: string) => void }) => {')

# 5. Prompts replacements
content = content.replace("alert('Í fullu kerfi opnast bókunargluggi hér!')", "onUnlockRequest('Ný Bókun')")

select_slot_old = """    const handleSelectSlot = ({ start, end }: any) => {
        const title = prompt('Nafn bókunar (eða "Leiga"):');
        if (title) {
            setBookings([...bookings, {
                id: Math.random().toString(),
                title,
                start,
                end,
                type: title.toLowerCase().includes('leiga') ? 'rental' : 'personal',
                notes: ''
            }]);
        }
    };"""
select_slot_new = """    const handleSelectSlot = ({ start, end }: any) => {
        onUnlockRequest('Bókanir í dagatal');
    };"""
content = content.replace(select_slot_old, select_slot_new)

finance_add_old = """    const handleAdd = () => {
        const desc = prompt('Skýring færslu:');
        const amountStr = prompt('Upphæð (neikvæð fyrir útgjöld):');
        if (desc && amountStr) {
            setEntries([{
                id: Math.random().toString(),
                date: new Date().toISOString().split('T')[0],
                description: desc,
                amount: parseInt(amountStr),
                type: parseInt(amountStr) > 0 ? 'income' : 'expense',
                category: 'General'
            }, ...entries]);
        }
    };"""
finance_add_new = """    const handleAdd = () => {
        onUnlockRequest('Bæta við fjármálafærslu');
    };"""
content = content.replace(finance_add_old, finance_add_new)

content = content.replace("const t = prompt('Nýtt verkefni:');\n                            if (t) setTasks([...tasks, { id: Math.random().toString(), title: t, assignee: '', status: 'todo' }]);", "onUnlockRequest('Stofna nýtt verkefni');")

# 6. Users Sandbox styling
users_btn_old = """                <button
                    onClick={() => navigate('/signup')}
                    className="btn btn-secondary flex items-center gap-2 opacity-50 cursor-not-allowed"
                >"""
users_btn_new = """                <button
                    onClick={() => onUnlockRequest('Bjóða Fjölskyldunni')}
                    className="btn btn-secondary flex items-center gap-2"
                >"""
content = content.replace(users_btn_old, users_btn_new)

users_overlay_old = """                {/* Locked Overlay */}
                <div className="absolute inset-0 bg-stone-50/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-8 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100 max-w-sm">
                        <Users className="w-12 h-12 text-amber mx-auto mb-4" />
                        <h4 className="text-xl font-bold mb-2">Læstur eiginleiki</h4>
                        <p className="text-stone-500 text-sm mb-6">
                            Til að bjóða fjölskyldunni og stýra aðgangi þarftu að stofna alvöru aðgang.
                        </p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn btn-primary w-full"
                        >
                            Stofna aðgang núna
                        </button>
                    </div>
                </div>"""
users_overlay_new = """                {/* Locked Overlay */}
                <div className="absolute inset-0 bg-stone-50/40 backdrop-blur-sm z-10 flex items-center justify-center p-8 text-center cursor-pointer" onClick={() => onUnlockRequest('Fjölskyldan & Meðeigendur')}>
                    <div className="bg-white/90 p-8 rounded-2xl shadow-xl border border-stone-100 max-w-sm hover:scale-105 transition-transform duration-300">
                        <Users className="w-12 h-12 text-amber mx-auto mb-4" />
                        <h4 className="text-xl font-bold mb-2">Læstur eiginleiki</h4>
                        <p className="text-stone-500 text-sm mb-6">
                            Í alvöru kerfinu geturðu fjölgað eigendum og fjölskyldumeðlimum að vild, algjörlega án takmarkana.
                        </p>
                        <button className="btn btn-primary w-full pointer-events-none">Sjá meira</button>
                    </div>
                </div>"""
content = content.replace(users_overlay_old, users_overlay_new)

# 7. SandboxPage state and passing props
page_state_old = """export default function SandboxPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'tasks' | 'users' | 'settings'>('calendar');
    const [sidebarOpen, setSidebarOpen] = useState(false);"""
page_state_new = """export default function SandboxPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'tasks' | 'users' | 'settings'>('calendar');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unlockModal, setUnlockModal] = useState<{ isOpen: boolean; feature: string }>({ isOpen: false, feature: '' });

    const handleUnlockRequest = (feature: string) => {
        setUnlockModal({ isOpen: true, feature });
    };"""
content = content.replace(page_state_old, page_state_new)

render_old = """                    <div className="max-w-7xl mx-auto h-full pb-32">
                        {activeTab === 'calendar' && <SandboxCalendar />}
                        {activeTab === 'finance' && <SandboxFinance />}
                        {activeTab === 'tasks' && <SandboxTasks />}
                        {activeTab === 'users' && <SandboxUsers />}
                        {activeTab === 'settings' && (
                            <div className="text-center py-20">
                                <Settings className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-charcoal">Stillingar</h2>
                                <p className="text-stone-500 max-w-md mx-auto mt-2">
                                    Í fullu útgáfunni getur þú stillt WiFi, húsreglur, boðið meðeigendum og fleira.
                                </p>
                                <button onClick={() => navigate('/signup')} className="btn btn-primary mt-6">
                                    Stofna aðgang til að sjá meira
                                </button>
                            </div>
                        )}
                    </div>"""
render_new = """                    <div className="max-w-7xl mx-auto h-full pb-32">
                        {activeTab === 'calendar' && <SandboxCalendar onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'finance' && <SandboxFinance onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'tasks' && <SandboxTasks onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'users' && <SandboxUsers onUnlockRequest={handleUnlockRequest} />}
                        {activeTab === 'settings' && (
                            <div className="text-center py-20 cursor-pointer hover:bg-white/50 rounded-2xl transition-colors p-8" onClick={() => handleUnlockRequest('Stillingar Hússins')}>
                                <Settings className="w-16 h-16 text-amber mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-charcoal">Stillingar hússins</h2>
                                <p className="text-stone-500 max-w-md mx-auto mt-2 mb-6">
                                    Hér myndir þú stilla WiFi lykilorð, húsreglur og upplýsingar sem gestir þínir sjá strax í símanum sínum.
                                </p>
                                <button className="btn btn-primary pointer-events-none">Prófa alvöru kerfið</button>
                            </div>
                        )}
                    </div>
                    
                    {/* Unlock Modal */}
                    {unlockModal.isOpen && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setUnlockModal({ isOpen: false, feature: '' })}>
                            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setUnlockModal({ isOpen: false, feature: '' })} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
                                    ✕
                                </button>
                                <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-8 h-8 text-amber" />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-center mb-4">Opnaðu {unlockModal.feature}</h3>
                                <p className="text-stone-600 text-center mb-8 leading-relaxed">
                                    Þetta er sýnishorn af kerfinu. Ef þú stofnar ókeypis aðgang núna geturðu byrjað á að leika þér með kerfið sjálft fyrir þinn bústað.
                                </p>
                                <div className="space-y-3">
                                    <button onClick={() => navigate('/signup')} className="btn btn-primary bg-amber text-charcoal hover:bg-amber-dark w-full py-4 text-lg border-0">
                                        Stofna ókeypis aðgang
                                    </button>
                                    <button onClick={() => setUnlockModal({ isOpen: false, feature: '' })} className="btn btn-ghost w-full py-4 text-stone-500">
                                        Skoða áfram sýnishornið
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}"""
content = content.replace(render_old, render_new)

# 8. Outdated banner replacement
banner_old = """                            <div className="flex-1">
                                <p className="text-amber text-xs font-bold uppercase tracking-widest mb-1">Takmarkað stofn-tilboð</p>
                                <h4 className="text-lg font-serif font-bold">Tryggðu þér sumarbústaðinn frítt í 1 ár</h4>
                                <p className="text-stone-400 text-xs mt-1">Aðeins 12 pláss eftir fyrir fyrstu 50 húsin.</p>
                            </div>

                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full md:w-auto btn bg-amber text-charcoal hover:bg-amber-dark font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(232,176,88,0.3)] transition-all transform hover:scale-105"
                            >
                                Virkja mitt hús
                            </button>"""
banner_new = """                            <div className="flex-1">
                                <p className="text-amber text-xs font-bold uppercase tracking-widest mb-1">Einfaldara líf í sumar</p>
                                <h4 className="text-lg font-serif font-bold">Prófaðu kerfið frítt í 30 daga</h4>
                                <p className="text-stone-400 text-xs mt-1">Bættu við fjölskyldunni og sjáðu hvort þetta hentar ykkur. Engin skuldbinding.</p>
                            </div>

                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full md:w-auto btn bg-amber text-charcoal hover:bg-amber-dark font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(232,176,88,0.3)] transition-all transform hover:scale-105 border-0"
                            >
                                Stofna ókeypis aðgang
                            </button>"""
content = content.replace(banner_old, banner_new)

# 9. Add Sparkles to missing imports
if 'Sparkles' not in content:
    content = content.replace('Users\n} from', 'Users, Sparkles\n} from')

with open('/Users/thorarinnhjalmarsson/Documents/Antigravity/bustadurinn.is/src/pages/SandboxPage.tsx', 'w') as f:
    f.write(content)

print('Done rewriting SandboxPage.tsx')
