import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-save-as-dialog',
  templateUrl: './save-as-dialog.component.html',
  styleUrls: ['./save-as-dialog.component.css']
})
export class SaveAsDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) private data: any, private matDialogRf: MatDialogRef<SaveAsDialogComponent>) { }

  ngOnInit(): void {
  }

  onSaveAsPNGClick(){
    this.data.saveDocumentTo("png");
    this.matDialogRf.close();
  }

  onSaveAsJPGClick(){
    this.data.saveDocumentTo("jpg");
    this.matDialogRf.close(true);
  }

  onCloseClick(){
    this.matDialogRf.close(true);
  }
}
