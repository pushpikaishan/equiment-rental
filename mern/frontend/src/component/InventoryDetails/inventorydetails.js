import React, { useState, useEffect, useRef } from "react";
import Nav from "../InventoryNavBar/nav";
import axios from "axios";
import Inventory from "../Inventory/inventory";
import { useReactToPrint } from "react-to-print";

const URL = "http://localhost:5000/Inventory";

const fetchHandler = async () => {
  return await axios.get(URL).then((res) => res.data);
};

function InventoryDetails() {
  const [inventory, setInventory] = useState([]);

  const ComponentsRef = useRef();

  useEffect(() => {
    fetchHandler()
      .then((data) => {
        setInventory(data.inventory || []); 
      })
      .catch((err) => {
        console.error("API fetch error:", err);
        setInventory([]); 
      });
  }, []);

  const handlePrint = useReactToPrint({
    content: () => ComponentsRef.current,
    documentTitle: "Inventory Report",
    onAfterPrint: () => alert("Inventory report Successfully Download!"),
  });
  

  return (
    <div>
      <Nav />
      <div ref={ComponentsRef}>
        <h1>Inventory Details</h1>
        <div>
          {inventory.length > 0 ? (
            inventory.map((item) => (
              <Inventory key={item._id} inventory={item} />
            ))
          ) : (
            <p>No inventory items found.</p>
          )}
        </div>
      </div>
    <button onClick={handlePrint}>Download Report</button>
    </div>
    
  );
}

export default InventoryDetails;
