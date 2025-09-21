import React from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Home from "./component/home/home";
import Log from "./component/userlog/login";

//register
import UserRegister from "./component/userregister/userregister";
import SupplierRegister from "./component/userregister/supplierRegister";
import AdminRegister from "./component/userregister/adminRegister";
import StaffRegister from "./component/userregister/staffRegister";

//update
import UserUpdate from "./component/userupdate/userupdate";
import SupplierUpdate from "./component/userupdate/supplierupdate";

//diaplay all
import DisAllUsers from "./component/disalluser/allUsers";
import DisAllStaff from "./component/disalluser/allstaff";
import DisAllSupplier from "./component/disalluser/allSuppliers";
import DisAllAdmins from "./component/disalluser/alladmin";
import StaffUpdate from "./component/userupdate/staffupdate";
import AdminUpdate from "./component/userupdate/adminupdate";


//lognavigate
import Userprof from "./component/userAccount/allprofile";

//user account
import UserMenu from "./component/userAccount/userMenu";

function App() {
  return (
    <div>
      <React.Fragment>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/userlog" element={<Log />} />

          <Route path="/userRegister" element={<UserRegister />} />
          <Route path="/SupplierRegister" element={<SupplierRegister />} />
          <Route path="/AdminRegister" element={<AdminRegister />} />
          <Route path="/StaffRegister" element={<StaffRegister />} />

          <Route path="/update-user/:id" element={<UserUpdate />} />
          <Route path="/update-supplier/:id" element={<SupplierUpdate />} />
          <Route path="/update-staff/:id" element={<StaffUpdate />} />
          <Route path="/update-admin/:id" element={<AdminUpdate />} />

          <Route path="/DisAllUsers" element={<DisAllUsers />} />
          <Route path="/DisAllStaff" element={<DisAllStaff />} />
          <Route path="/DisAllSupplier" element={<DisAllSupplier />} />
          <Route path="/DisAllAdmins" element={<DisAllAdmins />} />



          <Route path="/userAccount/profile" element={<Userprof />}/>
          <Route path="/UserMenu" element={<UserMenu />} />
<<<<<<< HEAD

          {/*inventory*/}
          <Route path="/" element={<InventoryHome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/addinventory" element={<Addinventory />} />
          <Route path="/inventorydetails" element={<Inventorydetails />} />
          <Route path="/updateInventory/:id" element={<UpdateInventory />} /> 

=======
>>>>>>> parent of b648f36 (equipment)
        </Routes>
      </React.Fragment>
    </div>
  );
}

export default App;
