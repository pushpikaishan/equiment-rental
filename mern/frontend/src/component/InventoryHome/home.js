import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Nav from "../InventoryNavBar/nav";

const URL = "http://localhost:5000/Inventory";

function Home() {
  const [inventories, setInventories] = useState([]);

  // ✅ Fetch all inventories
  const fetchInventories = async () => {
    try {
      const res = await axios.get(URL);
      setInventories(res.data.inventory || []);
    } catch (err) {
      console.error("Error fetching inventories:", err);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  return (
    <div>
      <Nav />
      <h1 style={{ textAlign: "center", marginTop: "20px" }}>
        Event eqipment rental <br></br>
        meka main home page eka, admin home eka newei, test krnn methnt dmme
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        {inventories.length > 0 ? (
          inventories.map((item) => (
            <div
              key={item._id}
              style={{
                width: "280px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                margin: "10px",
                padding: "15px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                textAlign: "center",
                backgroundColor: "#fff",
              }}
            >
             

              {/* ✅ Info */}
              <h3 style={{ margin: "10px 0" }}>{item.name}</h3>
              <p><strong>Quantity:</strong> {item.quantity}</p>
              <p><strong>Price:</strong> ${item.price}</p>
            

              {/* ✅ Rent Button */}
              <div style={{ marginTop: "10px" }}>
                <Link
                  to={`/rent/${item._id}`}   // <-- Adjust this route to your rent page
                  style={{
                    padding: "8px 16px",
                    background: "#43a047",
                    color: "#fff",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Rent Now
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p>No inventories available.</p>
        )}
      </div>
    </div>
  );
}

export default Home;
