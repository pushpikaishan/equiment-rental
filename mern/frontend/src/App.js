import React from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";


import Log from "./component/userlog/login";
import ForgotPassword from "./component/userlog/ForgotPassword";

//register
import UserRegister from "./component/userregister/userregister";
import SupplierRegister from "./component/userregister/supplierRegister";
import AdminRegister from "./component/userregister/adminRegister";
import StaffRegister from "./component/userregister/staffRegister";

//update
import UserUpdate from "./component/userupdate/userupdate";
import SupplierUpdate from "./component/userupdate/supplierupdate";
import StaffUpdate from "./component/userupdate/staffupdate";
import AdminUpdate from "./component/userupdate/adminupdate";

//diaplay all
import DisAllUsers from "./component/disalluser/allUsers";
import DisAllStaff from "./component/disalluser/allstaff";
import DisAllSupplier from "./component/disalluser/allSuppliers";
import DisAllAdmins from "./component/disalluser/alladmin";



//lognavigate
import Userprof from "./component/userAccount/allprofile";

//user account
import UserMenu from "./component/userAccount/userMenu";

//test
import RegCusOrSupButton from "./component/userlog/regCusOrSup";
import Testing from "./component/home/home";

//adminpanel
import AdminPanel from "./component/adminPanel/admindashboard";
import EquipmentList from "./component/shop/EquipmentList";
import EquipmentDetail from "./component/shop/EquipmentDetail";
import CartPage from "./component/shop/CartPage";
import MyBookings from "./component/shop/MyBookings";
import SupportPage from "./component/shop/SupportPage";
import PaymentGateway from "./component/shop/PaymentGateway";
import PaymentPage from "./component/shop/PaymentPage";
import NotificationsPage from "./component/userAccount/NotificationsPage";
import DriverDashboard from "./component/staff/DriverDashboard";
import SuppliersInventoryList from "./component/shop/SuppliersInventoryList";
import SupplierDashboard from "./component/supplierPanel/SupplierDashboard";
import TwoFactorSetup from "./component/userAccount/TwoFactorSetup";
import TwoFactorVerify from "./component/userlog/TwoFactorVerify";
import UserActivity from "./component/adminPanel/UserActivity";

function App() {
  return (
    <div>
      <React.Fragment>
        <Routes>
          <Route path="/" element={<Log />} />
          <Route path="/userlog" element={<Log />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
          <Route path="/Testing" element={<Testing />} />

       

          <Route path="/adminDashbooard" element={<AdminPanel />} />

          {/* User-facing shop routes */}
          <Route path="/home" element={<EquipmentList />} />
          <Route path="/suppliers-inventories" element={<SuppliersInventoryList />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/gateway" element={<PaymentGateway />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="/two-factor-auth" element={<TwoFactorSetup />} />
          <Route path="/two-factor-verify" element={<TwoFactorVerify />} />
          <Route path="/admin/user-activity" element={<UserActivity />} />

          <Route path="/RegCusOrSupButton" element={<RegCusOrSupButton />} />
         

        </Routes>
      </React.Fragment>
    </div>
  );
}

export default App;
