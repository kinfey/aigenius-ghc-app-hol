import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type Product = { id: string; name: string; description: string; price: number; icon: string; category: string; tag: string };
type Offer = { title: string; description: string; conditions: string };
type Offers = { source: "mock" | "mcp"; updatedAt: string; offers: Offer[]; providerText?: string[] };
type Page = "menu" | "offers";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`服务暂不可用（${response.status}），请检查后端后重试。`);
  return response.json() as Promise<T>;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState<Page>("menu");
  const [category, setCategory] = useState("全部");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offers | null>(null);
  const [offersError, setOffersError] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      setProducts((await getJson<{ products: Product[] }>("/api/products")).products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法加载餐品。");
    } finally {
      setLoading(false);
    }
  }
  async function loadOffers() {
    setOfferLoading(true);
    setOffersError("");
    try {
      setOffers(await getJson<Offers>("/api/offers"));
    } catch (e) {
      setOffers(null);
      setOffersError(e instanceof Error ? e.message : "无法加载优惠。");
    } finally {
      setOfferLoading(false);
    }
  }
  useEffect(() => { void loadProducts(); }, []);
  function showOffers() { setPage("offers"); void loadOffers(); }
  function changeCount(id: string, delta: number) {
    setCounts((old) => ({ ...old, [id]: Math.max(0, (old[id] || 0) + delta) }));
  }
  const cart = useMemo(() => products.filter((p) => counts[p.id] > 0), [products, counts]);
  const count = cart.reduce((total, p) => total + counts[p.id], 0);
  const total = cart.reduce((sum, p) => sum + p.price * counts[p.id], 0);
  const visible = category === "全部" ? products : products.filter((p) => p.category === category);

  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage("menu")} aria-label="食光，返回菜单">
          <span className="brand-icon">✳</span><span>食光 <small>GOOD FOOD, GOOD MOOD</small></span>
        </button>
        <nav className="nav" aria-label="主导航">
          <button className={page === "menu" ? "active" : ""} onClick={() => setPage("menu")}>点餐菜单</button>
          <button className={page === "offers" ? "active" : ""} onClick={showOffers}>优惠专区</button>
        </nav>
        <div className="top-actions"><span className="location">⌖ &nbsp;本地演示门店</span><button className="cart-toggle" onClick={() => setCartOpen(!cartOpen)}>购物车 <span>{count}</span></button></div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span>✦</span> 让每一餐，都值得期待</div>
            <h1>今天，想吃点<span>什么？</span></h1>
            <p>从喜欢的美味开始，给忙碌的一天一点好心情。</p>
            <button onClick={() => { setPage("menu"); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>开始点餐 <span>↗</span></button>
            <div className="hero-note">✦ &nbsp;教学演示 · 所有餐品与价格均为模拟数据</div>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="art-ring"><span>🍔</span></div><div className="art-label">GOOD FOOD<br /><b>GOOD MOOD</b></div><i className="sparkle s1">✦</i><i className="sparkle s2">✳</i></div>
        </section>
        <div className="content-layout">
          <section className="main-content" id="menu">
            {page === "menu" ? <>
              <div className="section-heading"><div><div className="overline">OUR MENU <span>✦</span></div><h2>为你准备的美味</h2><p>挑选喜欢的餐品，开启美好时刻</p></div><span className="section-mark">新鲜 · 好味道</span></div>
              <div className="filters" aria-label="餐品分类">{["全部", "汉堡", "小食", "饮品", "甜品"].map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
              {loading ? <p role="status">正在加载餐品…</p> : error ? <div className="notice error" role="alert">{error} <button onClick={() => void loadProducts()}>重试</button></div> : visible.length === 0 ? <p>暂无餐品。</p> :
                <div className="product-grid">{visible.map((p) => <article className="product" key={p.id}><div className={`product-art art-${p.id}`}><span className="product-tag">{p.tag}</span><span className="product-emoji" aria-hidden="true">{p.icon}</span><span className="art-dots">✧ · ✦</span></div><div className="product-info"><h3>{p.name}</h3><p>{p.description}</p><div className="product-bottom"><strong><small>¥</small>{p.price}<small>.00</small></strong><button aria-label={`添加${p.name}`} onClick={() => changeCount(p.id, 1)}>+</button></div></div></article>)}</div>}
            </> : <>
              <div className="section-heading"><div><div className="overline">SPECIAL OFFERS <span>✦</span></div><h2>发现你的专属优惠</h2><p>查看可用活动与使用条件，优惠以服务方结果为准</p></div></div>
              {offerLoading ? <p role="status">正在查询优惠…</p> : offersError ? <div className="notice error" role="alert">{offersError} <button onClick={() => void loadOffers()}>重试</button></div> : offers && <><div className="source">● {offers.source === "mock" ? "模拟数据 · 不可用于真实消费" : "麦当劳 MCP 实时数据"} <span>更新于 {new Date(offers.updatedAt).toLocaleString("zh-CN")}</span></div><div className="offer-grid">{offers.offers.map((offer) => <article className="offer-card" key={offer.title}><span className="ticket-icon">✳</span><div><h3>{offer.title}</h3><p>{offer.description}</p><small>{offer.conditions}</small></div><b>优惠</b></article>)}</div>{offers.source === "mcp" && <div className="live-results"><h3>服务方返回</h3>{offers.providerText?.length ? offers.providerText.map((text, i) => <pre key={i}>{text}</pre>) : <p>当前没有可展示的优惠。</p>}</div>}</>}
            </>}
          </section>
          <aside className={`cart ${cartOpen ? "open" : ""}`} aria-label="购物车">
            <div className="cart-title"><div><div className="overline">YOUR ORDER</div><h2>我的餐篮 <span>{count}</span></h2></div><span>🛍️</span></div>
            <div className="cart-store">⌖ <div><b>本地演示门店</b><small>仅供学习，不会创建真实订单</small></div></div>
            {cart.length === 0 ? <div className="cart-empty"><div>🛒</div><b>餐篮还是空的</b><p>快去挑选喜欢的美味吧</p></div> : <div className="cart-items">{cart.map((p) => <div className="cart-item" key={p.id}><span>{p.icon}</span><div><b>{p.name}</b><small>¥{p.price}.00</small></div><div className="quantity"><button aria-label={`减少${p.name}`} onClick={() => changeCount(p.id, -1)}>−</button><span>{counts[p.id]}</span><button aria-label={`增加${p.name}`} onClick={() => changeCount(p.id, 1)}>+</button></div></div>)}</div>}
            <div className="cart-summary"><div><span>商品合计</span><strong>¥{total}.00</strong></div><small>示例价格 · 优惠未计入</small><button disabled={count === 0} onClick={() => setCheckout(true)}>模拟结账 <span>→</span></button><p>仅为工作坊演示，不会发起支付</p></div>
          </aside>
        </div>
      </main>
      <footer>食光 · GitHub Copilot App Workshop <span>独立教学示例 · 非官方服务</span></footer>
      {checkout && <div className="modal-backdrop" onClick={() => setCheckout(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><div className="modal-icon">✓</div><h2 id="modal-title">模拟结账完成</h2><p>本次仅为教学演示，未创建订单，也未发生支付。</p><strong>模拟总额 ¥{total}.00</strong><button onClick={() => { setCheckout(false); setCounts({}); }}>完成</button></div></div>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
