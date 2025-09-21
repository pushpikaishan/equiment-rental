import React from "react";
import "./nav.css";
import { Link } from "react-router-dom";

function Nav() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/addinventory">Add Inventory</Link>
        </li>
        <li>
          <Link to="/inventorydetails">Inventory Details</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Nav;
