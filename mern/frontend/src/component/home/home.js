import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <Link to="/userlog" className="userlog">
        <h1>User Log</h1>
      </Link>


      <Link to="/userRegister" className="register">
        <h1>user register</h1>
      </Link>

       <Link to="/SupplierRegister" className="SupplierRegister">
        <h1>SupplierRegister</h1>
      </Link>

      <Link to="/AdminRegister" className="AdminRegister">
        <h1>AdminRegister</h1>
      </Link>

      <Link to="/StaffRegister" className="StaffRegister">
        <h1>StaffRegister</h1>
      </Link>





      <Link to="/DisAllUsers" className="DisAllUsers">
        <h1>Dis All User</h1>
      </Link>

      
      <Link to="/DisAllStaff" className="DisAllStaff">
        <h1>Dis All Staff</h1>
      </Link>

      <Link to="/DisAllSupplier" className="DisAllSupplier">
        <h1>Dis All Supplier</h1>
      </Link>

      
      <Link to="/DisAllAdmins" className="DisAllAdmins">
        <h1>Dis All Admins</h1>
      </Link>

      <Link to="/adminDashbooard" className="adminDashbooard">
        <h2>Admin Dashboard</h2>
      </Link>


      
    </div>

  );
}

export default Home;
