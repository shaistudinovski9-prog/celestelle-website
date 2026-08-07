// Presents a product image in the luxury layout. `panel` shows it as editorial
// photography in a soft rounded frame (object-fit: cover); otherwise the image
// floats on ivory with a soft drop shadow (object-fit: contain — never cropped).
export default function ProductVisual({ product, panel = false }) {
  if (!product?.image_url) {
    return <div className="pv-panel" aria-hidden="true" />;
  }
  return (
    <div className={panel ? 'pv-panel' : 'pv'}>
      <img src={product.image_url} alt={product.title} loading="lazy" />
    </div>
  );
}
