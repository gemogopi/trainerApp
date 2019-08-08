import { Injectable , Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { ActivatedRoute } from "@angular/router";
import { forkJoin } from 'rxjs';

import * as U from './utils';
import * as C from './constants';

interface courses {
  tclass: string,
  uid: string,
  assets: Array<courses>,
  expanded?: boolean
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private location: Location, private route: ActivatedRoute, private http: HttpClient) {
    this.location = location;
    this.route = route;
    this.http = http;
   }

  courses:courses;
  selected:string;

  ngOnInit() {
    this.route.queryParams.subscribe(data => {
      if(data.show) {
        const [tclass, uid] = data.show.split('!');
        this.fetchDeepLinkedData(tclass, uid);
      } else {
        this.fetchData();
      }
    });
  }

  getDeepPath(tclass:string, uid:string) {
    return this.getEntity(tclass, uid, C.endPoint.TREE_PATH)
  }

  getEntity(tclass:string, uid:string, api:string = C.endPoint.ENTITY) {
    return this.http.get(`${C.BASE_API_URL}${tclass}/${uid}${api}`)
  }

  fetchDeepLinkedData(tclass:string, uid:string) {
      this.getDeepPath(tclass, uid).subscribe((data:any) => {
        const paths = data.response.paths[0];
        const parentPaths = this.isTypeOfGroup(tclass) ? paths : paths.slice(1, paths.length);
        const requests = parentPaths.reverse().map(path => this.getEntity(path.type, path.uid));
        forkJoin(...requests).subscribe(responses => {
          let courses = responses[0];
          if(responses.length > 1) {
            for(let i = 1; i < responses.length; i++) {
              courses.assets = U.update(courses.assets, responses[i].uid, responses[i])
            }
          }
          this.courses = courses;
          this.courses.expanded = true;
          this.selected = uid;
        });
      });
  }

  fetchData() {
    this.getEntity('', '', C.endPoint.LIBRARY).subscribe((data:any) => {
      this.getEntity(data.root.tclass, data.root.uid).subscribe((data:courses) => {
        this.courses = data;
        this.courses.expanded = true;
        this.selected = data.uid;
      });
    });
  }

  isTypeOfGroup(tclass:string) {
    return tclass === C.iconType.GROUP;
  }

  itemClick(item:courses) {
    console.log(item);
    if(this.isTypeOfGroup(item.tclass)){
      if(!item.assets) {
        this.getEntity(item.tclass, item.uid).subscribe(data => {
          this.courses.assets = U.update(this.courses.assets, item.uid, data);
        })
      } else if(this.selected === item.uid) {
        this.courses.assets = U.update(this.courses.assets, item.uid, null);
      }
    }
    this.selected = item.uid;
    this.updateRouteQueryParam(item.tclass, item.uid);
  }

  updateRouteQueryParam(tclass:string, uid:string) {
    if(tclass && uid) {
      this.location.replaceState('', `show=${tclass}!${uid}`);
    }
  }
}
