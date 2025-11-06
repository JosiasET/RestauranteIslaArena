import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-home',
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-home.html',
  styleUrl: './edit-home.css'
})
export class EditHome {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Array para almacenar las imágenes
  imagenes: any[] = [];

  // Disparar el input file
  seleccionarImagen(): void {
    this.fileInput.nativeElement.click();
  }

  // Cuando se selecciona un archivo
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      console.log('📁 Archivo seleccionado:', file.name);
      
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        const imagenDataUrl = e.target.result;
        console.log('🖼️ Imagen convertida a Data URL');
        
        // AGREGAR LA IMAGEN AL ARRAY con un ID único
        this.imagenes.push({
          id: Date.now(),
          src: imagenDataUrl,
          name: file.name
        });
        
        console.log('✅ Imagen agregada al array. Total:', this.imagenes.length);
        console.log('📊 Array completo:', this.imagenes);
        
        // Mostrar alerta
        alert('🎉 ¡IMAGEN SUBIDA CORRECTAMENTE! Verifica la galería abajo.');
        
        // Limpiar input
        this.fileInput.nativeElement.value = '';
      };
      
      reader.onerror = (error) => {
        console.error('❌ Error al leer archivo:', error);
        alert('Error al cargar la imagen');
      };
      
      reader.readAsDataURL(file);
    } else {
      alert('⚠️ Por favor selecciona un archivo de imagen válido');
    }
  }

  // Eliminar imagen
  eliminarImagen(index: number): void {
    this.imagenes.splice(index, 1);
    console.log('🗑️ Imagen eliminada. Total:', this.imagenes.length);
  }

  // Forzar actualización
  actualizarVista(): void {
    console.log('🔄 Forzando actualización de vista');
    this.imagenes = [...this.imagenes];
  }

  // Ver array en consola
  verArrayEnConsola(): void {
    console.log('📝 Array de imágenes:', this.imagenes);
    console.log('🔍 Número de elementos:', this.imagenes.length);
    
    if (this.imagenes.length > 0) {
      console.log('🖼️ Primera imagen src:', this.imagenes[0].src.substring(0, 100) + '...');
    }
  }

  // Cuando la imagen se carga correctamente
  onImageLoad(index: number): void {
    console.log('✅ Imagen cargada correctamente:', index);
  }

  // Cuando hay error cargando la imagen
  onImageError(index: number): void {
    console.error('❌ Error cargando imagen:', index);
  }
}