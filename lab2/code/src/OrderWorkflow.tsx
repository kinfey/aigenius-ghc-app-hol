import { useState } from "react";
import { ADDRESSES, Draft, MenuProduct, STORES, initialDraft, money, orderErrors, priceOrder } from "./order";

type Props = {
  draft: Draft;
  products: MenuProduct[];
  save: (draft: Draft) => void;
  onMenu: () => void;
  menuReady: boolean;
};

export function OrderWorkflow({ draft, products, save, onMenu, menuReady }: Props) {
  const [error, setError] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const price = priceOrder(draft, products);
  const errors = orderErrors(draft, products);
  function edit(patch: Partial<Draft>) {
    save({ ...draft, ...patch, status: "draft" });
    setError("");
  }
  function confirm() {
    if (!menuReady || errors.length) {
      setError(!menuReady ? "餐品尚未加载成功，请返回菜单重试。" : errors.join(" "));
      return;
    }
    save({ ...draft, status: "confirmed" });
    setError("");
  }
  const steps = [
    { title: "选餐", done: price.count > 0 },
    { title: "方式 / 门店", done: Boolean(draft.store) },
    ...(draft.method === "delivery" ? [{ title: "虚构地址", done: Boolean(draft.address) }] : []),
    { title: "优惠 / 核价", done: !errors.length && menuReady },
    { title: "用户确认", done: draft.status !== "draft" },
    { title: "模拟支付", done: draft.status === "payment-demo" },
  ];
  return <section className="workflow" aria-labelledby="workflow-title">
    <div className="section-heading"><div><div className="overline">ORDER WORKFLOW · LAB 03</div><h2 id="workflow-title">点餐工作流</h2><p>沿用实验二菜单与只读优惠，完成安全的模拟点餐。</p></div></div>
    <div className="notice mock-banner">仅模拟 · 商品、门店、地址、优惠及金额均为虚构数据。不会创建真实订单或付款。</div>
    <ol className="workflow-steps" aria-label="点餐进度">{steps.map((step, index) => <li key={step.title} className={step.done ? "done" : ""}><span>{step.done ? "✓" : index + 1}</span>{step.title}</li>)}</ol>
    <div className="workflow-panel">
      <h3>1 · 餐品与就餐方式</h3>
      <p>餐篮共有 {price.count} 件商品。<button className="text-button" onClick={onMenu}>返回菜单选餐</button></p>
      <fieldset><legend>就餐方式</legend><div className="method-options">
        <label><input type="radio" name="method" checked={draft.method === "pickup"} onChange={() => edit({ method: "pickup", address: "" })} />到店取餐</label>
        <label><input type="radio" name="method" checked={draft.method === "delivery"} onChange={() => edit({ method: "delivery" })} />配送</label>
      </div></fieldset>
      <label className="field">模拟门店<select aria-label="模拟门店" value={draft.store} onChange={(e) => edit({ store: e.target.value })}><option value="">请选择门店</option>{STORES.map((store) => <option key={store}>{store}</option>)}</select></label>
      {draft.method === "delivery" && <label className="field">虚构配送地址<select aria-label="虚构配送地址" value={draft.address} onChange={(e) => edit({ address: e.target.value })}><option value="">请选择虚构地址</option>{ADDRESSES.map((address) => <option key={address}>{address}</option>)}</select><small>仅允许演示地址，不收集真实地址或联系方式。</small></label>}
    </div>
    <div className="workflow-panel">
      <h3>2 · 模拟优惠与价格核对</h3>
      <label className="field">模拟优惠<select aria-label="模拟优惠" value={draft.coupon} onChange={(e) => edit({ coupon: e.target.value === "save5" ? "save5" : "none" })}><option value="none">不使用优惠</option><option value="save5">商品满 ¥50 减 ¥5（模拟）</option></select></label>
      {draft.coupon === "save5" && price.subtotal < 5000 && <p role="status">商品金额未满 ¥50，优惠未生效。</p>}
      <p className="workflow-note">实验二的实时优惠仅供只读查看，不会被自动应用到此模拟订单。</p>
      <ul className="review-items">{products.filter((p) => draft.counts[p.id] > 0).map((p) => <li key={p.id}><span>{p.name} × {draft.counts[p.id]}</span><b>{money(Math.round(p.price * 100) * draft.counts[p.id])}</b></li>)}</ul>
      <dl className="price-breakdown"><div><dt>商品小计</dt><dd>{money(price.subtotal)}</dd></div><div><dt>模拟优惠</dt><dd>−{money(price.discount)}</dd></div><div><dt>配送费</dt><dd>{money(price.delivery)}</dd></div><div className="grand-total"><dt>模拟应付</dt><dd data-testid="workflow-total">{money(price.total)}</dd></div></dl>
      <p>{draft.method === "pickup" ? "到店取餐" : "配送"} · {draft.store || "尚未选择门店"}{draft.method === "delivery" ? ` · ${draft.address || "尚未选择虚构地址"}` : ""}</p>
    </div>
    <div className="workflow-panel">
      <h3>3 · 明确确认与模拟支付演示</h3>
      {errors.length > 0 && <ul className="workflow-note">{errors.map((item) => <li key={item}>{item}</li>)}</ul>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <p className="status-line" role="status">{draft.status === "draft" ? "等待确认；修改任意订单字段后都需要重新确认。" : draft.status === "confirmed" ? "模拟草稿已确认。未创建真实订单，未支付。" : "模拟支付跳转演示完成。未创建真实订单，未付款。"}</p>
      <div className="workflow-actions"><button className="primary-button" disabled={draft.status !== "draft" || !menuReady} onClick={confirm}>确认模拟草稿（不下单）</button>
        <button disabled={draft.status !== "confirmed" || !menuReady || errors.length > 0} onClick={() => save({ ...draft, status: "payment-demo" })}>演示支付跳转（不付款）</button></div>
      <p className="workflow-note">支付演示仅改变本地状态，不打开外部链接、不请求支付接口。默认可在核对页面停止。</p>
      {!resetPending ? <button className="text-button" onClick={() => setResetPending(true)}>重置模拟草稿</button> : <div className="reset-confirm" role="group" aria-label="确认重置"><p>清空餐篮和模拟确认状态？</p><button onClick={() => { save(initialDraft()); setError(""); setResetPending(false); }}>确认重置</button><button onClick={() => setResetPending(false)}>保留草稿</button></div>}
    </div>
  </section>;
}
