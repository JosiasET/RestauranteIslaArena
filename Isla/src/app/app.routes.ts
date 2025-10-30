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
import { SeguimientoPedidosComponent } from './pages/client/seguimiento-pedidos/seguimiento-pedidos';
import { AdminTrackingComponent } from './pages/admin/admin-tracking/admin-tracking';
import { UpStockAmdPage } from './pages/admin/up-stock-amd/up-stock-amd';


export const routes: Routes = [
  {
    path: '',
    component: Header,
    children: [
      { path: 'Home', component: Home },
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
    // Ruta vacía - el componente Gestoramd maneja el dashboard
    { path: 'upresumen', component: UpResumeAmd },
    { path: 'upsales', component: UpSalesAmd },
    { path: 'updrink', component: UpDrinkAmd },
    { path: 'upfood', component: UpFoodAmd },
    { path: 'upfish', component: UpFishesAmd },
    { path: 'uppromotion', component: UpPromotionAmd },
    { path: 'celebrae', component: UpCelebratesAmd},
    { path: 'cwaiter', component: UpCreatewaiterAmd },
    {path: 'tracking', component: AdminTrackingComponent },
    { path: 'upstock', component: UpStockAmdPage }
  ]
},

  // Direct route for cashier checkout
  { path: 'cashier-checkout', component: CashierCheckout }
];