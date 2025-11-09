const deleteProduct = async (btn) => {
  const productId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest('article');

  console.log(productId);
  console.log(csrf);
  

  try {
    const response = await fetch(`/admin/product/${productId}`, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    });
    const data = await response.json();
    console.log(data);
    productElement.parentNode.removeChild(productElement);
    
  } catch (err) {
    console.log(err);
  }
};
