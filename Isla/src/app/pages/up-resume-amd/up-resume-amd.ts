import { Component } from '@angular/core';
import { AfterViewInit } from '@angular/core';
declare var google: any;

@Component({
  selector: 'app-up-resume-amd',
  imports: [],
  templateUrl: './up-resume-amd.html',
  styleUrl: './up-resume-amd.css'
})
export class UpResumeAmd {
  valorResta: number = 12450.00;
  valorCrudo: number=3780.50;
  total : number= this.valorCrudo + this.valorResta;
  Nombreper: string = 'JOSE MANUEL AKE';
  turno : string = 'Noche';
  activo: boolean = true;


}
