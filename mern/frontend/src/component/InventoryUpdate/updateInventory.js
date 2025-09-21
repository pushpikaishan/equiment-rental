import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

function UpdateInventory() {
  const [inputs, setInputs] = useState({ name: "", quantity: 0, price: 0 });
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchHandler = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/Inventory/${id}`);
        const data = res.data.inventory || res.data;
        setInputs({
          name: data.name || "",
          quantity: data.quantity || 0,
          price: data.price || 0,
        });
      } catch (err) {
        console.error("Error fetching inventory:", err);
      }
    };
    fetchHandler();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prevState) => ({
      ...prevState,
      [name]:
        name === "quantity" || name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/Inventory/${id}`, inputs);
      navigate("/inventorydetails");
    } catch (err) {
      console.error("Error updating inventory:", err);
    }
  };

  return (
    <div>
      <h1>Update Inventory</h1>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <br />
        <input
          type="text"
          name="name"
          onChange={handleChange}
          value={inputs.name}
          required
        />
        <br /><br />

        <label>Quantity</label>
        <br />
        <input
          type="number"
          name="quantity"
          onChange={handleChange}
          value={inputs.quantity}
          required
        />
        <br /><br />

        <label>Price</label>
        <br />
        <input
          type="number"
          name="price"
          onChange={handleChange}
          value={inputs.price}
          step="0.01"
          required
        />
        <br /><br />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default UpdateInventory;
