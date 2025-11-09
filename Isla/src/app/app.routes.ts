import { Routes } from '@angular/router';
import { Header } from './shared/header/header';
import { Home } from './pages/client/home/home';
import { Login } from './shared/login/login';
import { Gestoramd } from './shared/gestoramd/gestoramd';
import { UpResumeAmd } from './pages/admin/up-resume-amd/up-resume-amd';
import { CashierCheckout } from './pages/cashier-checkout/cashier-checkout';
import { Mycart } from './shared/mycart/mycart';
import { Checkoutpage } from './pages/checkoutpage/checkoutpage';
import { UpDrinkAmd } from './pages/admin/up-drink-amd/up-drink-amd';
import { UpCelebratesAmd } from './pages/admin/up-celebrates-amd/up-celebrates-amd';
import { Fishes } from './pages/client/fishes/fishes';
import { UpCreatewaiterAmd } from './pages/admin/up-createwaiter-amd/up-createwaiter-amd';
import { UpPromotionAmd } from './pages/admin/up-promotion-amd/up-promotion-amd';
import { UpFishesAmd } from './pages/admin/up-fishes-amd/up-fishes-amd';
import { UpFoodAmd } from './pages/admin/up-food-amd/up-food-amd';
import { UpSalesAmd } from './pages/admin/up-sales-amd/up-sales-amd';
import { Drink } from './pages/client/drink/drink';
import { Food } from './pages/client/food/food';
import { Celebrates } from './pages/client/celebrates/celebrates';
import { Promotions } from './pages/client/promotions/promotions';
import { EditHome } from './pages/admin/edit-home/edit-home';
import { SeguimientoPedidosComponent } from './pages/client/seguimiento-pedidos/seguimiento-pedidos';
import { AdminTrackingComponent } from './pages/admin/admin-tracking/admin-tracking';
import { UpStockAmdPage } from './pages/admin/up-stock-amd/up-stock-amd';
<<<<<<< HEAD
=======
import { Component } from '@angular/core';
import { GestorUsuario } from './shared/gestor-usuario/gestor-usuario';


>>>>>>> 955cbce7960e166d21af940c863435e1f5219b42

export const routes: Routes = [
  {
    path: '',
    component: Header,
    children: [
      { path: 'Home', component: Home},
      { path: 'Drink', component: Drink},
      { path: 'fishes', component: Fishes },
      { path: 'Food', component: Food },
      { path: 'celebrate', component: Celebrates },
      { path: 'prmotion', component: Promotions },
      { path: 'cart', component: Mycart },
      { path: 'checkout', component: Checkoutpage },
      { path: 'seguimiento', component: SeguimientoPedidosComponent }
    ]
  },

  { path: 'Login', component: Login, pathMatch: 'full' },

  {
    path: 'gestoramd',
    component: Gestoramd,
    children: [
      // ✅ AGREGAR RUTA VACÍA - Esto es crucial
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: UpResumeAmd }, // O el componente que quieras para dashboard
      { path: 'upresumen', component: UpResumeAmd },
      { path: 'upsales', component: UpSalesAmd },
      { path: 'updrink', component: UpDrinkAmd },
      { path: 'upfood', component: UpFoodAmd },
      { path: 'upfish', component: UpFishesAmd },
      { path: 'uppromotion', component: UpPromotionAmd },
      { path: 'celebrae', component: UpCelebratesAmd},
      { path: 'cwaiter', component: UpCreatewaiterAmd },   
      { path: 'edit-home', component: EditHome},
      { path: 'tracking', component: AdminTrackingComponent },
      { path: 'upstock', component: UpStockAmdPage }
    ]
  },

<<<<<<< HEAD
  {
    path: 'home', 
    component: Home,
    children: [
      { path: 'fishes', component: Fishes },
      { path: 'Drink', component: Drink },
      { path: 'food', component: Food },
    ]
  },
=======
  { path: 'Drink', component: Drink},
>>>>>>> 955cbce7960e166d21af940c863435e1f5219b42

  // Direct route for cashier checkout
  { path: 'cashier-checkout', component: CashierCheckout },
  {path:'gestorU' , component: GestorUsuario, 
    children:
      [
        {path: 'tracking', component: AdminTrackingComponent },
        { path: 'upsales', component: UpSalesAmd },
        { path: 'celebrae', component: UpCelebratesAmd}
      ]
  }
];