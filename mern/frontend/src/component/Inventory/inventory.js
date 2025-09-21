import React from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";


function Inventory({ inventory }) {
  const { _id, name, quantity, price } = inventory;
  const navigate = useNavigate();

  const deleteHandler = async () => {
    try {
      await axios.delete(`http://localhost:5000/Inventory/${_id}`);
      navigate("/inventorydetails");
    } catch (err) {
      console.error("Error deleting inventory:", err);
    }
  };

  return (
    <div style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
      <p><strong>ID:</strong> {_id}</p>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Quantity:</strong> {quantity}</p>
      <p><strong>Price for unit:</strong> Rs. {price}</p>

      <button><Link to={`/updateInventory/${_id}`}>Update</Link></button>
      <button onClick={deleteHandler}>Delete</button>
    </div>
  );
}

export default Inventory;
