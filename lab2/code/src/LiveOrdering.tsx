import { useEffect, useRef, useState } from "react";
import "./live.css";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Row = { [key: string]: Json };
type Item = { productCode: string; quantity: number; couponId?: string; roundList?: Row[] };
type LiveState = {
  connected: boolean; credentialsConfigured: boolean; method: number; step: number;
  addresses: Row[]; address: Row | null; stores: Row[]; store: Row | null;
  menu: Row[]; details: Record<string, Json>; items: Item[]; coupons: Row[];
  couponData: Json; quote: Row | null; quoteId: string | null;
  attempt: "none" | "submitting" | "created" | "unknown"; order: Row | null; orderId: string | null;
  tools: string[];
  needTableware: boolean; remark: string;
};
const labels: Record<string, string> = {
  storeCode: "门店编码", storeName: "门店", beCode: "配送业务编码", addressId: "地址 ID",
  fullAddress: "完整地址", contactName: "联系人", phone: "电话", productCode: "餐品编码",
  name: "名称", productName: "餐品", quantity: "数量", totalPrice: "总价",
  originalPrice: "原价", actualPrice: "实付价格", deliveryFee: "配送费",
  discountAmount: "优惠金额", totalAmount: "总金额", payAmount: "应付金额",
  orderId: "订单号", orderStatus: "订单状态", status: "状态", message: "服务方提示",
  takeWayList: "可选取餐方式", price: "价格", couponId: "优惠券 ID", couponCode: "优惠券编码",
  round: "搭配组", choices: "可选搭配", isDefault: "默认选项", supportModify: "支持特调",
};
function object(value: Json | undefined): value is Row {
  return value !== undefined && value !== null && typeof value === "object" && !Array.isArray(value);
}
function rows(value: Json | undefined, key: string): Row[] {
  if (Array.isArray(value)) return value.flatMap((item) => rows(item, key));
  if (!object(value)) return [];
  if (key in value) return [value];
  return Object.values(value).flatMap((child) => rows(child, key));
}
function text(value: Json | undefined): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
function name(row: Row): string {
  for (const key of ["storeName", "productName", "name", "couponName", "title"]) {
    if (typeof row[key] === "string" && row[key]) return row[key];
  }
  return text(row.productCode || row.code || row.storeCode || row.couponId) || "服务方选项";
}
function DataView({ value, field = "", payment = false }: { value: Json; field?: string; payment?: boolean }) {
  if (value === null) return <span>—</span>;
  if (Array.isArray(value)) return <div className="live-data-list">{value.map((child, i) => <DataView key={i} value={child} payment={payment} />)}</div>;
  if (object(value)) return <dl className="live-data">{Object.entries(value).map(([key, child]) => <div key={key}><dt>{labels[key] || key}</dt><dd><DataView field={key} value={child} payment={payment} /></dd></div>)}</dl>;
  if (payment && typeof value === "string" && /^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.hostname === "mcd.cn" || url.hostname.endsWith(".mcd.cn") || url.hostname === "mcdonalds.com.cn" || url.hostname.endsWith(".mcdonalds.com.cn")) {
        return <a href={url.href} target="_blank" rel="noopener noreferrer">打开服务方链接（由你自行决定是否支付）</a>;
      }
    } catch { /* Invalid provider links are displayed as text, never opened. */ }
    return <span>服务方返回了未识别域名的链接；请前往麦当劳 App 查看，不自动打开。</span>;
  }
  if (typeof value === "number" && /price|amount|fee/i.test(field)) {
    return <span>¥{(value / 100).toFixed(2)} <small>（{value} 分）</small></span>;
  }
  return <span>{typeof value === "boolean" ? (value ? "是" : "否") : String(value)}</span>;
}

class RequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function requestState(action?: string, payload: Record<string, unknown> = {}): Promise<LiveState> {
  const response = await fetch(action ? "/api/ordering/action" : "/api/ordering/session", action ? {
    method: "POST", headers: { "Content-Type": "application/json", "X-Ordering-Intent": "user-action" },
    body: JSON.stringify({ action, payload }),
  } : { cache: "no-store" });
  const data: unknown = await response.json();
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data && typeof data.detail === "string" ? data.detail : "请求失败，请稍后重试。";
    throw new RequestError(detail, response.status);
  }
  return data as LiveState;
}

export function LiveOrdering() {
  const [state, setState] = useState<LiveState | null>(null);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState(2);
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [cart, setCart] = useState<Item[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [menuSearch, setMenuSearch] = useState(() => new URLSearchParams(location.search).get("want") || "");
  const [menuCategory, setMenuCategory] = useState("");
  const [roundChoices, setRoundChoices] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [tableware, setTableware] = useState(false);
  const [remark, setRemark] = useState("");
  const [takeWay, setTakeWay] = useState("");
  const [consent, setConsent] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [unknownSubmission, setUnknownSubmission] = useState(false);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    requestState().then((data) => {
      if (!active) return;
      setState(data); setMethod(data.method); setCart(data.items);
      setTableware(data.needTableware); setRemark(data.remark);
    }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "无法读取点餐会话。"); });
    return () => { active = false; };
  }, []);

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (running.current) return null;
    running.current = true;
    setBusy(true); setError("");
    try {
      const next = await requestState(action, payload);
      setState(next);
      if (action === "method" || action === "quote") {
        setTableware(next.needTableware); setRemark(next.remark);
      }
      if (action !== "detail" && action !== "coupons" && action !== "connect") {
        setCart(next.items);
        setConsent(false); setConfirmation(""); setShowConfirm(false); setTakeWay("");
      }
      if (action === "method" || action === "stores" || action === "select-store") {
        setSelectedProduct(""); setCoupon(""); setRoundChoices({});
      }
      if (action === "create") setUnknownSubmission(false);
      section.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败。");
      if (action === "create") {
        setUnknownSubmission(true);
        setConsent(false); setConfirmation(""); setShowConfirm(false);
        try {
          const latest = await requestState();
          setState(latest);
          const rejectedBeforeSubmission = latest.attempt === "none" && e instanceof RequestError && e.status >= 400 && e.status < 500;
          setUnknownSubmission(!rejectedBeforeSubmission && latest.attempt !== "created");
        } catch { setError("下单结果不确定。请前往麦当劳 App 核实，禁止重复下单。"); }
      }
      return null;
    } finally {
      running.current = false; setBusy(false);
    }
  }

  const detail = state?.details[selectedProduct];
  const rounds = rows(detail, "round");
  const availableCoupons = state?.coupons.filter((row) => text(row.productCode || row.code) === selectedProduct) || [];
  const step = state?.step || 0;
  const locked = busy || unknownSubmission || Boolean(state && state.attempt !== "none");
  const categories = [...new Set(state?.menu.flatMap((product) => Array.isArray(product.categories) ? product.categories.map(text) : []) || [])];
  const visibleMenu = state?.menu.filter((product) => name(product).toLocaleLowerCase().includes(menuSearch.trim().toLocaleLowerCase())
    && (!menuCategory || (Array.isArray(product.categories) && product.categories.includes(menuCategory)))) || [];

  async function inspect(product: Row) {
    setSelectedProduct(text(product.productCode));
    setRoundChoices({}); setQuantity(1); setCoupon("");
    const next = await act("detail", { productCode: text(product.productCode) });
    if (next) {
      const defaults: Record<string, string> = {};
      for (const group of rows(next.details[text(product.productCode)], "round")) {
        const options = rows(group.choices, "code");
        const choices = options.filter((option) => option.isDefault === 1);
        if (choices.length === 1) defaults[text(group.round)] = text(choices[0].code);
      }
      setRoundChoices(defaults);
    }
  }
  function addProduct() {
    if (!selectedProduct || detail === undefined) { setError("请先查询餐品详情。"); return; }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) { setError("数量必须为 1 至 99。"); return; }
    const roundList: Row[] = [];
    for (const group of rounds) {
      const options = rows(group.choices, "code");
      const selected = options.find((option) => text(option.code) === roundChoices[text(group.round)]);
      const defaults = options.filter((option) => option.isDefault === 1);
      const required = defaults.reduce((sum, option) => sum + (typeof option.quantity === "number" ? option.quantity : 1), 0);
      if (!selected || required < 1) { setError("请逐组选择套餐搭配；无法识别默认数量时不能加入。"); return; }
      roundList.push({ round: text(group.round), comboItemList: [{ code: text(selected.code), quantity: required }] });
    }
    if (cart.length >= 30) { setError("一次最多添加 30 个餐品条目。"); return; }
    setCart([...cart, { productCode: selectedProduct, quantity, ...(roundList.length ? { roundList } : {}), ...(coupon ? { couponId: coupon } : {}) }]);
    setSelectedProduct(""); setCoupon(""); setError("");
  }

  return <div className="live-shell">
    <header className="live-header"><a className="live-brand" href="/">✳ 食光 <small>LIVE MCP · 非官方个人工具</small></a><span className="live-badge">真实服务 · 无模拟回退</span></header>
    <main className="live-layout">
      <aside className="live-sidebar"><p className="overline">GUIDED ORDERING</p><h1>一步一步，<br />选好这一餐。</h1><p>先选方式与门店，再选餐、核价。只有你明确确认后，才会创建真实订单。</p>
        <ol className="live-progress">{["连接 MCP", "就餐方式 / 地址", "选择门店", "选餐与搭配", "优惠与餐具", "实时核价 / 确认", "订单与支付"].map((title, i) => <li key={title} className={step === i ? "current" : step > i ? "complete" : ""} aria-current={step === i ? "step" : undefined}><span>{step > i ? "✓" : i + 1}</span>{title}</li>)}</ol>
        <div className="live-privacy">Token 只留在服务器。地址与订单仅在本机会话内存中使用，不写入浏览器存储。请勿分享包含个人资料或支付链接的截图。</div>
      </aside>
      <section ref={section} className="live-stage" aria-busy={busy}>
        {error && <div className="notice error" role="alert">{error}</div>}
        {busy && <p className="live-loading" role="status">正在请求麦当劳 MCP，请稍候…</p>}
        {!state ? <div className="live-card"><h2>读取本地点餐会话</h2><p>若服务未启动，请检查 Python 后端。</p><button disabled={busy} onClick={() => { void requestState().then(setState).catch((e: unknown) => setError(e instanceof Error ? e.message : "无法连接后端。")); }}>重新读取</button></div> : <>
          {step === 0 && <div className="live-card"><span className="overline">01 / CONNECT</span><h2>连接真实 MCP 服务</h2><p>浏览器通过实验二的 Python 后端连接 MCP。App 的 MCP 连接与网页后端是两个独立客户端，不会共享 Token。</p>
            <p className={state.credentialsConfigured ? "live-success" : "notice error"}>{state.credentialsConfigured ? "服务器已配置凭据；点击下方按钮验证真实工具列表。" : "服务器未配置凭据。请在本地环境文件设置 MCD_MCP_TOKEN，不要粘贴到网页或聊天。"}</p>
            <button disabled={busy} onClick={() => void act("connect")}>{state.connected ? "重新验证连接" : "连接并发现工具"}</button>
            {state.connected && <><p className="live-success" role="status">已连接，发现 {state.tools.length} 个点餐工具。</p><details><summary>查看实际可用工具</summary><ul>{state.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul></details><div className="live-next"><button onClick={() => void act("method", { method })} disabled={busy}>开始引导 →</button></div></>}
          </div>}
          {step === 1 && <div className="live-card"><span className="overline">02 / FULFILLMENT</span><h2>你想怎样取餐？</h2>
            <div className="live-methods"><button disabled={locked} className={state.method === 1 ? "chosen" : ""} onClick={() => { setMethod(1); void act("method", { method: 1 }); }}>到店自取<small>选择收藏门店或按位置搜索</small></button><button disabled={locked} className={state.method === 2 ? "chosen" : ""} onClick={() => { setMethod(2); void act("method", { method: 2 }); }}>麦乐送配送<small>从你的已保存地址选择</small></button></div>
            {state.method === 2 ? <><h3>选择已保存的配送地址</h3><p>仅在点击后读取账号地址。本应用不新增地址；需要时请先到麦当劳 App 添加。</p><button disabled={locked} onClick={() => void act("addresses")}>读取我的配送地址</button>
              {state.addresses.length > 0 && <fieldset className="live-addresses"><legend>请选择配送地址</legend>{state.addresses.map((address) => <label key={text(address.addressId)} className="live-option"><input type="radio" name="address" checked={selectedAddress === text(address.addressId)} onChange={() => setSelectedAddress(text(address.addressId))} /><div><b>{text(address.contactName)} · {text(address.phone)}</b><p>{text(address.fullAddress)}</p><small>地址 ID：{text(address.addressId)}</small></div></label>)}</fieldset>}
              <button className="live-primary" disabled={locked || !selectedAddress} onClick={() => void act("stores", { addressId: selectedAddress })}>查询该地址可配送门店 →</button>
            </> : <><h3>搜索取餐门店</h3><div className="live-fields"><label>城市<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="填写你所在的城市" /></label><label>位置关键词<input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="商圈、道路或地标" /></label></div><div className="live-buttons"><button disabled={locked} onClick={() => void act("stores", { searchType: 1 })}>查询收藏门店</button><button disabled={locked || !city.trim() || !keyword.trim()} onClick={() => void act("stores", { searchType: 2, city, keyword })}>按位置查询门店 →</button></div></>}
          </div>}
          {step === 2 && <div className="live-card"><span className="overline">03 / STORE</span><h2>选择这次的门店</h2><p>只展示服务方实际返回的门店，不虚构距离或营业状态。目前仅支持即时点餐；需要预约请使用麦当劳 App。</p>
            {state.stores.length === 0 && <p role="status">当前没有可用门店，请返回修改地址或搜索条件。</p>}
            <div className="live-store-grid">{state.stores.map((store) => <article className="live-store" key={text(store.storeCode)}><h3>{name(store)}</h3><p>门店编码：{text(store.storeCode)}{store.beCode ? ` · 配送业务编码：${text(store.beCode)}` : ""}</p><details><summary>查看门店详情与可预约时段</summary><DataView value={store} /></details><button disabled={locked} onClick={() => void act("select-store", { storeCode: text(store.storeCode) })}>选择并加载真实菜单 →</button></article>)}</div>
            <button className="live-back" disabled={locked} onClick={() => void act("method", { method: state.method })}>← 修改方式或地址</button>
          </div>}
          {step === 3 && <div className="live-card"><span className="overline">04 / MENU</span><h2>挑选餐品与搭配</h2><p>{state.store ? name(state.store) : ""} · 先查看详情，再确认套餐搭配。展示金额以最后的 MCP 核价为准。</p>
            <label className="live-field">想吃什么？<input type="search" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="例如：巨无霸" /></label>
            {categories.length > 0 && <label className="live-field">菜单分类<select value={menuCategory} onChange={(e) => setMenuCategory(e.target.value)}><option value="">全部分类</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>}
            <div className="live-menu">{visibleMenu.map((product) => <button disabled={locked} key={text(product.productCode)} onClick={() => void inspect(product)} className={selectedProduct === text(product.productCode) ? "chosen" : ""}><b>{name(product)}</b><small>{text(product.productCode)}</small>{typeof product.currentPrice === "string" && /^\d+(\.\d{1,2})?$/.test(product.currentPrice) && <small>实时菜单展示价 ¥{product.currentPrice} · 最终以核价为准</small>}{typeof product.discountType === "string" && <small>{product.discountType} · 适用条件以服务方核价为准</small>}{product.supportModify === true && <small>可特调</small>}<span>查看详情与搭配 →</span></button>)}</div>
            {state.menu.length > 0 && visibleMenu.length === 0 && <div className="notice" role="status">当前门店此时段的实时菜单中未找到“{menuSearch || menuCategory}”。不会用虚构商品替代。可清空搜索查看在售餐品，或在麦当劳 App 选择其他时段。<button onClick={() => { setMenuSearch(""); setMenuCategory(""); }}>查看全部在售餐品</button></div>}
            {state.menu.length === 0 && <p role="status">当前没有可识别的在售餐品。请更换门店或重试加载。</p>}
            {selectedProduct && detail !== undefined && <div className="live-detail"><h3>确认当前餐品</h3>{object(detail) && detail.supportModify === true && <p>【可特调】本向导仅使用默认特调；如需调整，请在麦当劳 App 操作。</p>}
              <details><summary>查看服务方详情与默认搭配</summary><DataView value={detail} /></details>
              {rounds.map((group) => <label className="live-field" key={text(group.round)}>套餐搭配：{name(group)}<select value={roundChoices[text(group.round)] || ""} onChange={(e) => setRoundChoices({ ...roundChoices, [text(group.round)]: e.target.value })}><option value="">请选择搭配</option>{rows(group.choices, "code").map((option) => <option value={text(option.code)} key={text(option.code)}>{name(option)}{option.supportModify === true ? "【可特调】" : ""}{option.isDefault === 1 ? "（默认）" : ""}</option>)}</select></label>)}
              <label className="live-field">数量<input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label>
              <button disabled={locked} onClick={() => void act("coupons")}>查询当前门店可用优惠</button>
              {availableCoupons.length > 0 && <label className="live-field">该餐品可选优惠<select value={coupon} onChange={(e) => setCoupon(e.target.value)}><option value="">不使用优惠</option>{availableCoupons.map((offer) => <option key={text(offer.couponId)} value={text(offer.couponId)}>{name(offer)}</option>)}</select></label>}
              <button className="live-primary" disabled={locked} onClick={addProduct}>加入本次餐篮</button>
            </div>}
            <Cart items={cart} menu={state.menu} remove={locked ? undefined : (i) => setCart(cart.filter((_, index) => i !== index))} />
            <button className="live-primary" disabled={locked || cart.length === 0} onClick={() => void act("items", { items: cart })}>确认餐品，继续 →</button>
            <button className="live-back" disabled={locked} onClick={() => void act("stores", state.method === 2 ? { addressId: state.address?.addressId } : { searchType: 1 })}>← 重新选择门店</button>
          </div>}
          {step === 4 && <div className="live-card"><span className="overline">05 / PREFERENCES</span><h2>查看优惠，确认配送偏好</h2><Cart items={state.items} menu={state.menu} />
            <button disabled={locked} onClick={() => void act("coupons")}>查询门店真实可用优惠</button>
            {state.couponData !== null && <details open><summary>服务方返回的优惠与使用条件</summary><DataView value={state.couponData} /></details>}
            <p>优惠必须对应到餐品，并由实时核价确认。可返回选餐页为对应商品选择优惠，不会自动领券或消耗积分。</p>
            <label className="live-check"><input type="checkbox" checked={tableware} onChange={(e) => setTableware(e.target.checked)} />需要餐具（费用以实时核价为准）</label>
            {state.method === 2 && <label className="live-field">配送备注（选填，最多 50 字）<input maxLength={50} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="例如：无接触配送" /></label>}
            <div className="live-buttons"><button disabled={locked} onClick={() => { void act("edit", { step: 3 }); setSelectedProduct(""); }}>← 返回选餐</button><button className="live-primary" disabled={locked} onClick={() => void act("quote", { needTableware: tableware, remark })}>请求 MCP 实时核价 →</button></div>
          </div>}
          {step === 5 && state.quote && <div className="live-card"><span className="overline">06 / REVIEW</span><h2>最后核对，再决定是否下单</h2><p>以下是 MCP 实时核价，不是本地估算。价格字段单位为分，已在可识别的金额字段旁换算为元。报价确认有效期为 5 分钟。</p>
            <div className="live-review"><h3>{state.method === 2 ? "麦乐送配送" : "到店自取"} · {state.store ? name(state.store) : ""}</h3>{state.address && <p>{text(state.address.fullAddress)} · {text(state.address.contactName)} · {text(state.address.phone)}</p>}<Cart items={state.items} menu={state.menu} /><p>餐具：{tableware ? "需要" : "不需要"}{remark ? ` · 备注：${remark}` : ""}</p><DataView value={state.quote.data ?? state.quote} /></div>
            {state.method === 1 && <label className="live-field">取餐方式<select value={takeWay} onChange={(e) => { setTakeWay(e.target.value); setShowConfirm(false); }}><option value="">请选择服务方取餐方式</option>{object(state.quote.data) && Array.isArray(state.quote.data.takeWayList) && state.quote.data.takeWayList.filter(object).map((way) => <option key={text(way.code)} value={text(way.code)}>{name(way)}</option>)}</select></label>}
            <p className="notice">当前尚未创建订单。你可以停在这里；继续创建会修改真实账号，并可能产生费用。</p>
            {!showConfirm ? <button className="live-primary" disabled={locked || (state.method === 1 && !takeWay)} onClick={() => setShowConfirm(true)}>我要创建真实订单，进入确认</button> : <div className="live-confirm"><h3>单独确认本次真实下单</h3><label className="live-check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />我已核对门店、地址、商品、优惠和费用；同意仅创建本次真实订单，付款由我自行操作。</label><label className="live-field">输入“确认创建真实订单”<input autoComplete="off" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label><button className="live-danger" disabled={locked || !consent || confirmation !== "确认创建真实订单"} onClick={() => void act("create", { quoteId: state.quoteId, confirmation, takeWayCode: takeWay })}>确认创建真实订单（不自动支付）</button></div>}
            <div className="live-buttons"><button disabled={locked} onClick={() => void act("edit", { step: 4 })}>← 修改餐品 / 偏好并重新核价</button><button disabled={locked} onClick={() => void act("quote", { needTableware: tableware, remark })}>重新核价</button></div>
          </div>}
          {(step === 6 || unknownSubmission) && <div className="live-card"><span className="overline">07 / ORDER</span><h2>{state.attempt === "created" ? "订单已创建，支付由你完成" : "下单结果需要核实"}</h2><p className="notice">{state.attempt === "created" ? "创建订单不等于支付成功。请自行打开服务方支付页面或麦当劳 App。" : "本次请求可能已经创建订单。禁止自动重试，请前往麦当劳 App 查询，避免重复下单。"}</p>
            {state.order && <DataView value={state.order.data ?? state.order} payment />}
            <button disabled={busy || !state.orderId} onClick={() => void act("status")}>我已支付 / 支付失败，查询实际状态</button>
            <p>不会自动付款，也不会将“已生成支付链接”标记为付款成功。刷新页面会恢复当前服务器会话；服务重启后，请先在麦当劳 App 核实订单。</p>
          </div>}
        </>}
      </section>
    </main>
    <footer>实验二应用 + 真实 MCP 引导流程 · 仅本机访问 · 不自动下单、领券或付款</footer>
  </div>;
}

function Cart({ items, menu, remove }: { items: Item[]; menu: Row[]; remove?: (index: number) => void }) {
  return <div className="live-cart"><h3>本次餐篮 · {items.reduce((sum, item) => sum + item.quantity, 0)} 件</h3>{items.length === 0 ? <p>先选择餐品并查看搭配。</p> : items.map((item, index) => <div key={index}><span>{name(menu.find((product) => text(product.productCode) === item.productCode) || { productCode: item.productCode })} × {item.quantity}{item.couponId ? " · 已选择优惠券" : ""}</span>{remove && <button aria-label={`移除餐品${index + 1}`} onClick={() => remove(index)}>移除</button>}</div>)}</div>;
}
