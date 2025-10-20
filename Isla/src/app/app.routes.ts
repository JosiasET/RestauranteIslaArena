import { Routes } from '@angular/router';
import { Header } from './shared/header/header';
import { Home } from './pages/home/home';
import { Drink } from './pages/drink/drink';
import { Food } from './pages/food/food';
import { Celebrates } from './pages/celebrates/celebrates';
import { Promotions } from './pages/promotions/promotions';
import { Login } from './shared/login/login';
import { Gestoramd } from './shared/gestoramd/gestoramd';
import { UpResumeAmd } from './pages/up-resume-amd/up-resume-amd';
import { UpDrinkAmd } from './pages/up-drink-amd/up-drink-amd';
import { UpFoodAmd } from './pages/up-food-amd/up-food-amd';
import { UpFishesAmd } from './pages/up-fishes-amd/up-fishes-amd';
import { UpSalesAmd } from './pages/up-sales-amd/up-sales-amd';
import { CashierCheckout } from './pages/cashier-checkout/cashier-checkout';
import { UpPromotionAmd } from './pages/up-promotion-amd/up-promotion-amd';
import { UpCreatewaiterAmd } from './pages/up-createwaiter-amd/up-createwaiter-amd';
import { UpCelebratesAmd } from './pages/up-celebrates-amd/up-celebrates-amd';
import { Mycart } from './shared/mycart/mycart';
import { Fishes } from './pages/fishes/fishes';
import { Checkoutpage } from './pages/checkoutpage/checkoutpage';

export const routes: Routes = [
  {
    path: '',
    component: Header,
    children: [
      { path: 'Home', component: Home },
      { path: 'Drink', component: Drink },
      { path: 'fishes', component: Fishes },
      { path: 'Food', component: Food },
      { path: 'celebrate', component: Celebrates },
      { path: 'prmotion', component: Promotions },
      { path: 'cart', component: Mycart },
      { path: 'checkout', component: Checkoutpage } 
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
    { path: 'celebrae', component: UpCelebratesAmd },
    { path: 'cwaiter', component: UpCreatewaiterAmd }
  ]
},

  // Direct route for cashier checkout
  { path: 'cashier-checkout', component: CashierCheckout }
];