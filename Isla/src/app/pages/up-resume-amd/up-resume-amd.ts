import { Component } from '@angular/core';
import { AfterViewInit } from '@angular/core';
declare var google: any;

@Component({
  selector: 'app-up-resume-amd',
  imports: [],
  templateUrl: './up-resume-amd.html',
  styleUrl: './up-resume-amd.css'
})
export class UpResumeAmd implements AfterViewInit{
  valorResta: number = 12450.00;
  valorCrudo: number=3780.50;
  total : number= this.valorCrudo + this.valorResta;
  Nombreper: string = 'JOSE MANUEL AKE';
  turno : string = 'Noche';
  activo: boolean = true;


  // GRAFICAS
 ngAfterViewInit(): void {
    this.loadGoogleCharts().then(() => {
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(this.drawChart.bind(this));
    });
  }

  private loadGoogleCharts(): Promise<void> {
    return new Promise((resolve) => {
      if (document.getElementById('googleChartsScript')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'googleChartsScript';
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  private drawChart() {
    const data = google.visualization.arrayToDataTable([
      ['Task', 'Hours per Day'],
      ['PEZCADOS FRITOS', 11],
      ['CEVICHE CON CAMARON', 15],
      ['CASON ASADO', 2],
    ]);

    const options = {
      is3D: true,
    };

    const chart = new google.visualization.PieChart(
      document.getElementById('piechart_3d')
    );
    chart.draw(data, options);
  }

  //

}
