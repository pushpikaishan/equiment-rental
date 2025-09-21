import React, { useState } from 'react'
import Nav from "../InventoryNavBar/nav"
import { useNavigate } from 'react-router-dom'
import axios from 'axios';

function AddInventory() {  
  const navigate = useNavigate(); 
  const [inputs, setInputs] = useState({
    name:"",
    quantity:"",
    price:"",
    discription:"",
  });

  const [image, setImage] = useState(null);

  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputs);
    sendRequest().then(()=>navigate('/inventorydetails'))
  }

  const sendRequest = async () => {
    await axios.post("http://localhost:5000/Inventory", {
      name: String(inputs.name),
      quantity: Number(inputs.quantity),
      price: Number(inputs.price),
    }).then(res => res.data);
  }

  return (
    <div>
      <Nav />
      <h1>Add Inventory</h1>
      <form onSubmit={handleSubmit}>
        <label>Name</label><br/>
        <input 
          type="text" 
          name="name" 
          onChange={handleChange} 
          value={inputs.name} 
          required 
        /><br/><br/>

        <label>Quantity</label><br/>
        <input 
          type="number" 
          name="quantity" 
          onChange={handleChange} 
          value={inputs.quantity} 
          required 
        /><br/><br/>

        <label>Price for unit</label><br/>
        <input 
          type="text" 
          name="price" 
          onChange={handleChange} 
          value={inputs.price} 
          required 
        /><br/><br/>

        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default AddInventory;
