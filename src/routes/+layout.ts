// GitHub Pages tamamen statik olduğu için sayfayı önceden (build zamanında)
// statik bir HTML kabuğuna dönüştürüyoruz (prerender). Ancak sayfa içeriği
// ?url=&id=&title= sorgu parametrelerine göre TAMAMEN istemci tarafında
// (tarayıcıda) belirleniyor — SvelteKit, prerender sırasında sorgu
// parametrelerine erişimi güvenlik/tutarlılık amacıyla engellediği için
// ssr=false ile bu sayfanın sunucu tarafında (build anında) render
// edilmesini tamamen atlıyoruz; sadece boş bir kabuk üretilip tarayıcıda
// hydrate ediliyor.
export const prerender = true;
export const ssr = false;
