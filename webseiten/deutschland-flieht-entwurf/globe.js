var X=class{constructor(){this._partials=new Float64Array(32),this._n=0}add(e){let r=this._partials,n=0;for(let i=0;i<this._n&&i<32;i++){let a=r[i],u=e+a,l=Math.abs(e)<Math.abs(a)?e-(u-a):a-(u-e);l&&(r[n++]=l),e=u}return r[n]=e,this._n=n+1,this}valueOf(){let e=this._partials,r=this._n,n,i,a,u=0;if(r>0){for(u=e[--r];r>0&&(n=u,i=e[--r],u=n+i,a=i-(u-n),!a););r>0&&(a<0&&e[r-1]<0||a>0&&e[r-1]>0)&&(i=a*2,n=u+i,i==n-u&&(u=n))}return u}};function*vr(t){for(let e of t)yield*e}function At(t){return Array.from(vr(t))}var I=1e-6,_t=1e-12,F=Math.PI,nt=F/2,Pe=F/4,tt=F*2,J=180/F,C=F/180,K=Math.abs,wn=Math.atan,Z=Math.atan2,M=Math.cos;var Qt=Math.hypot;var E=Math.sin,Mn=Math.sign||function(t){return t>0?1:t<0?-1:0},Y=Math.sqrt;function Pn(t){return t>1?0:t<-1?F:Math.acos(t)}function Q(t){return t>1?nt:t<-1?-nt:Math.asin(t)}function Ae(t){return(t=E(t/2))*t}function W(){}function te(t,e){t&&kn.hasOwnProperty(t.type)&&kn[t.type](t,e)}var An={Feature:function(t,e){te(t.geometry,e)},FeatureCollection:function(t,e){for(var r=t.features,n=-1,i=r.length;++n<i;)te(r[n].geometry,e)}},kn={Sphere:function(t,e){e.sphere()},Point:function(t,e){t=t.coordinates,e.point(t[0],t[1],t[2])},MultiPoint:function(t,e){for(var r=t.coordinates,n=-1,i=r.length;++n<i;)t=r[n],e.point(t[0],t[1],t[2])},LineString:function(t,e){ke(t.coordinates,e,0)},MultiLineString:function(t,e){for(var r=t.coordinates,n=-1,i=r.length;++n<i;)ke(r[n],e,0)},Polygon:function(t,e){Rn(t.coordinates,e)},MultiPolygon:function(t,e){for(var r=t.coordinates,n=-1,i=r.length;++n<i;)Rn(r[n],e)},GeometryCollection:function(t,e){for(var r=t.geometries,n=-1,i=r.length;++n<i;)te(r[n],e)}};function ke(t,e,r){var n=-1,i=t.length-r,a;for(e.lineStart();++n<i;)a=t[n],e.point(a[0],a[1],a[2]);e.lineEnd()}function Rn(t,e){var r=-1,n=t.length;for(e.polygonStart();++r<n;)ke(t[r],e,1);e.polygonEnd()}function ut(t,e){t&&An.hasOwnProperty(t.type)?An[t.type](t,e):te(t,e)}function Bt(t){return[Z(t[1],t[0]),Q(t[2])]}function ht(t){var e=t[0],r=t[1],n=M(r);return[n*M(e),n*E(e),E(r)]}function Tt(t,e){return t[0]*e[0]+t[1]*e[1]+t[2]*e[2]}function kt(t,e){return[t[1]*e[2]-t[2]*e[1],t[2]*e[0]-t[0]*e[2],t[0]*e[1]-t[1]*e[0]]}function ee(t,e){t[0]+=e[0],t[1]+=e[1],t[2]+=e[2]}function Dt(t,e){return[t[0]*e,t[1]*e,t[2]*e]}function Gt(t){var e=Y(t[0]*t[0]+t[1]*t[1]+t[2]*t[2]);t[0]/=e,t[1]/=e,t[2]/=e}var Ht,ne,re,ie,oe,ae,ue,le,Re,Le,ze,qn,In,rt,it,ot,ct={sphere:W,point:qe,lineStart:Ln,lineEnd:zn,polygonStart:function(){ct.lineStart=Sr,ct.lineEnd=Er},polygonEnd:function(){ct.lineStart=Ln,ct.lineEnd=zn}};function qe(t,e){t*=C,e*=C;var r=M(e);Kt(r*M(t),r*E(t),E(e))}function Kt(t,e,r){++Ht,re+=(t-re)/Ht,ie+=(e-ie)/Ht,oe+=(r-oe)/Ht}function Ln(){ct.point=xr}function xr(t,e){t*=C,e*=C;var r=M(e);rt=r*M(t),it=r*E(t),ot=E(e),ct.point=yr,Kt(rt,it,ot)}function yr(t,e){t*=C,e*=C;var r=M(e),n=r*M(t),i=r*E(t),a=E(e),u=Z(Y((u=it*a-ot*i)*u+(u=ot*n-rt*a)*u+(u=rt*i-it*n)*u),rt*n+it*i+ot*a);ne+=u,ae+=u*(rt+(rt=n)),ue+=u*(it+(it=i)),le+=u*(ot+(ot=a)),Kt(rt,it,ot)}function zn(){ct.point=qe}function Sr(){ct.point=br}function Er(){Cn(qn,In),ct.point=qe}function br(t,e){qn=t,In=e,t*=C,e*=C,ct.point=Cn;var r=M(e);rt=r*M(t),it=r*E(t),ot=E(e),Kt(rt,it,ot)}function Cn(t,e){t*=C,e*=C;var r=M(e),n=r*M(t),i=r*E(t),a=E(e),u=it*a-ot*i,l=ot*n-rt*a,g=rt*i-it*n,d=Qt(u,l,g),o=Q(d),s=d&&-o/d;Re.add(s*u),Le.add(s*l),ze.add(s*g),ne+=o,ae+=o*(rt+(rt=n)),ue+=o*(it+(it=i)),le+=o*(ot+(ot=a)),Kt(rt,it,ot)}function Wt(t){Ht=ne=re=ie=oe=ae=ue=le=0,Re=new X,Le=new X,ze=new X,ut(t,ct);var e=+Re,r=+Le,n=+ze,i=Qt(e,r,n);return i<_t&&(e=ae,r=ue,n=le,ne<I&&(e=re,r=ie,n=oe),i=Qt(e,r,n),i<_t)?[NaN,NaN]:[Z(r,e)*J,Q(n/i)*J]}function $t(t,e){function r(n,i){return n=t(n,i),e(n[0],n[1])}return t.invert&&e.invert&&(r.invert=function(n,i){return n=e.invert(n,i),n&&t.invert(n[0],n[1])}),r}function Ie(t,e){return K(t)>F&&(t-=Math.round(t/tt)*tt),[t,e]}Ie.invert=Ie;function Bn(t,e,r){return(t%=tt)?e||r?$t(Fn(t),_n(e,r)):Fn(t):e||r?_n(e,r):Ie}function Nn(t){return function(e,r){return e+=t,K(e)>F&&(e-=Math.round(e/tt)*tt),[e,r]}}function Fn(t){var e=Nn(t);return e.invert=Nn(-t),e}function _n(t,e){var r=M(t),n=E(t),i=M(e),a=E(e);function u(l,g){var d=M(g),o=M(l)*d,s=E(l)*d,f=E(g),m=f*r+o*n;return[Z(s*i-m*a,o*r-f*n),Q(m*i+s*a)]}return u.invert=function(l,g){var d=M(g),o=M(l)*d,s=E(l)*d,f=E(g),m=f*i-s*a;return[Z(s*i+f*a,o*r+m*n),Q(m*r-o*n)]},u}function Dn(t,e,r,n,i,a){if(r){var u=M(e),l=E(e),g=n*r;i==null?(i=e+n*tt,a=e-g/2):(i=Tn(u,i),a=Tn(u,a),(n>0?i<a:i>a)&&(i+=n*tt));for(var d,o=i;n>0?o>a:o<a;o-=g)d=Bt([u,-l*M(o),-l*E(o)]),t.point(d[0],d[1])}}function Tn(t,e){e=ht(e),e[0]-=t,Gt(e);var r=Pn(-e[1]);return((-e[2]<0?-r:r)+tt-I)%tt}function se(){var t=[],e;return{point:function(r,n,i){e.push([r,n,i])},lineStart:function(){t.push(e=[])},lineEnd:W,rejoin:function(){t.length>1&&t.push(t.pop().concat(t.shift()))},result:function(){var r=t;return t=[],e=null,r}}}function Rt(t,e){return K(t[0]-e[0])<I&&K(t[1]-e[1])<I}function fe(t,e,r,n){this.x=t,this.z=e,this.o=r,this.e=n,this.v=!1,this.n=this.p=null}function ce(t,e,r,n,i){var a=[],u=[],l,g;if(t.forEach(function(h){if(!((b=h.length-1)<=0)){var b,v=h[0],L=h[b],w;if(Rt(v,L)){if(!v[2]&&!L[2]){for(i.lineStart(),l=0;l<b;++l)i.point((v=h[l])[0],v[1]);i.lineEnd();return}L[0]+=2*I}a.push(w=new fe(v,h,null,!0)),u.push(w.o=new fe(v,null,w,!1)),a.push(w=new fe(L,h,null,!1)),u.push(w.o=new fe(L,null,w,!0))}}),!!a.length){for(u.sort(e),Gn(a),Gn(u),l=0,g=u.length;l<g;++l)u[l].e=r=!r;for(var d=a[0],o,s;;){for(var f=d,m=!0;f.v;)if((f=f.n)===d)return;o=f.z,i.lineStart();do{if(f.v=f.o.v=!0,f.e){if(m)for(l=0,g=o.length;l<g;++l)i.point((s=o[l])[0],s[1]);else n(f.x,f.n.x,1,i);f=f.n}else{if(m)for(o=f.p.z,l=o.length-1;l>=0;--l)i.point((s=o[l])[0],s[1]);else n(f.x,f.p.x,-1,i);f=f.p}f=f.o,o=f.z,m=!m}while(!f.v);i.lineEnd()}}}function Gn(t){if(e=t.length){for(var e,r=0,n=t[0],i;++r<e;)n.n=i=t[r],i.p=n,n=i;n.n=i=t[0],i.p=n}}function Ce(t){return K(t[0])<=F?t[0]:Mn(t[0])*((K(t[0])+F)%tt-F)}function Hn(t,e){var r=Ce(e),n=e[1],i=E(n),a=[E(r),-M(r),0],u=0,l=0,g=new X;i===1?n=nt+I:i===-1&&(n=-nt-I);for(var d=0,o=t.length;d<o;++d)if(f=(s=t[d]).length)for(var s,f,m=s[f-1],h=Ce(m),b=m[1]/2+Pe,v=E(b),L=M(b),w=0;w<f;++w,h=y,v=z,L=D,m=A){var A=s[w],y=Ce(A),R=A[1]/2+Pe,z=E(R),D=M(R),G=y-h,B=G>=0?1:-1,T=B*G,P=T>F,O=v*z;if(g.add(Z(O*B*E(T),L*D+O*M(T))),u+=P?G+B*tt:G,P^h>=r^y>=r){var _=kt(ht(m),ht(A));Gt(_);var H=kt(a,_);Gt(H);var c=(P^G>=0?-1:1)*Q(H[2]);(n>c||n===c&&(_[0]||_[1]))&&(l+=P^G>=0?1:-1)}}return(u<-I||u<I&&g<-_t)^l&1}function pe(t,e,r,n){return function(i){var a=e(i),u=se(),l=e(u),g=!1,d,o,s,f={point:m,lineStart:b,lineEnd:v,polygonStart:function(){f.point=L,f.lineStart=w,f.lineEnd=A,o=[],d=[]},polygonEnd:function(){f.point=m,f.lineStart=b,f.lineEnd=v,o=At(o);var y=Hn(d,n);o.length?(g||(i.polygonStart(),g=!0),ce(o,Mr,y,r,i)):y&&(g||(i.polygonStart(),g=!0),i.lineStart(),r(null,null,1,i),i.lineEnd()),g&&(i.polygonEnd(),g=!1),o=d=null},sphere:function(){i.polygonStart(),i.lineStart(),r(null,null,1,i),i.lineEnd(),i.polygonEnd()}};function m(y,R){t(y,R)&&i.point(y,R)}function h(y,R){a.point(y,R)}function b(){f.point=h,a.lineStart()}function v(){f.point=m,a.lineEnd()}function L(y,R){s.push([y,R]),l.point(y,R)}function w(){l.lineStart(),s=[]}function A(){L(s[0][0],s[0][1]),l.lineEnd();var y=l.clean(),R=u.result(),z,D=R.length,G,B,T;if(s.pop(),d.push(s),s=null,!!D){if(y&1){if(B=R[0],(G=B.length-1)>0){for(g||(i.polygonStart(),g=!0),i.lineStart(),z=0;z<G;++z)i.point((T=B[z])[0],T[1]);i.lineEnd()}return}D>1&&y&2&&R.push(R.pop().concat(R.shift())),o.push(R.filter(wr))}}return f}}function wr(t){return t.length>1}function Mr(t,e){return((t=t.x)[0]<0?t[1]-nt-I:nt-t[1])-((e=e.x)[0]<0?e[1]-nt-I:nt-e[1])}var Ne=pe(function(){return!0},Pr,kr,[-F,-nt]);function Pr(t){var e=NaN,r=NaN,n=NaN,i;return{lineStart:function(){t.lineStart(),i=1},point:function(a,u){var l=a>0?F:-F,g=K(a-e);K(g-F)<I?(t.point(e,r=(r+u)/2>0?nt:-nt),t.point(n,r),t.lineEnd(),t.lineStart(),t.point(l,r),t.point(a,r),i=0):n!==l&&g>=F&&(K(e-n)<I&&(e-=n*I),K(a-l)<I&&(a-=l*I),r=Ar(e,r,a,u),t.point(n,r),t.lineEnd(),t.lineStart(),t.point(l,r),i=0),t.point(e=a,r=u),n=l},lineEnd:function(){t.lineEnd(),e=r=NaN},clean:function(){return 2-i}}}function Ar(t,e,r,n){var i,a,u=E(t-r);return K(u)>I?wn((E(e)*(a=M(n))*E(r)-E(n)*(i=M(e))*E(t))/(i*a*u)):(e+n)/2}function kr(t,e,r,n){var i;if(t==null)i=r*nt,n.point(-F,i),n.point(0,i),n.point(F,i),n.point(F,0),n.point(F,-i),n.point(0,-i),n.point(-F,-i),n.point(-F,0),n.point(-F,i);else if(K(t[0]-e[0])>I){var a=t[0]<e[0]?F:-F;i=r*a/2,n.point(-a,i),n.point(0,i),n.point(a,i)}else n.point(e[0],e[1])}function Kn(t){var e=M(t),r=2*C,n=e>0,i=K(e)>I;function a(o,s,f,m){Dn(m,t,r,f,o,s)}function u(o,s){return M(o)*M(s)>e}function l(o){var s,f,m,h,b;return{lineStart:function(){h=m=!1,b=1},point:function(v,L){var w=[v,L],A,y=u(v,L),R=n?y?0:d(v,L):y?d(v+(v<0?F:-F),L):0;if(!s&&(h=m=y)&&o.lineStart(),y!==m&&(A=g(s,w),(!A||Rt(s,A)||Rt(w,A))&&(w[2]=1)),y!==m)b=0,y?(o.lineStart(),A=g(w,s),o.point(A[0],A[1])):(A=g(s,w),o.point(A[0],A[1],2),o.lineEnd()),s=A;else if(i&&s&&n^y){var z;!(R&f)&&(z=g(w,s,!0))&&(b=0,n?(o.lineStart(),o.point(z[0][0],z[0][1]),o.point(z[1][0],z[1][1]),o.lineEnd()):(o.point(z[1][0],z[1][1]),o.lineEnd(),o.lineStart(),o.point(z[0][0],z[0][1],3)))}y&&(!s||!Rt(s,w))&&o.point(w[0],w[1]),s=w,m=y,f=R},lineEnd:function(){m&&o.lineEnd(),s=null},clean:function(){return b|(h&&m)<<1}}}function g(o,s,f){var m=ht(o),h=ht(s),b=[1,0,0],v=kt(m,h),L=Tt(v,v),w=v[0],A=L-w*w;if(!A)return!f&&o;var y=e*L/A,R=-e*w/A,z=kt(b,v),D=Dt(b,y),G=Dt(v,R);ee(D,G);var B=z,T=Tt(D,B),P=Tt(B,B),O=T*T-P*(Tt(D,D)-1);if(!(O<0)){var _=Y(O),H=Dt(B,(-T-_)/P);if(ee(H,D),H=Bt(H),!f)return H;var c=o[0],q=s[0],N=o[1],V=s[1],U;q<c&&(U=c,c=q,q=U);var vt=q-c,et=K(vt-F)<I,dt=et||vt<I;if(!et&&V<N&&(U=N,N=V,V=U),dt?et?N+V>0^H[1]<(K(H[0]-c)<I?N:V):N<=H[1]&&H[1]<=V:vt>F^(c<=H[0]&&H[0]<=q)){var lt=Dt(B,(-T+_)/P);return ee(lt,D),[H,Bt(lt)]}}}function d(o,s){var f=n?t:F-t,m=0;return o<-f?m|=1:o>f&&(m|=2),s<-f?m|=4:s>f&&(m|=8),m}return pe(u,l,a,n?[0,-t]:[-F,t-F])}function Wn(t,e,r,n,i,a){var u=t[0],l=t[1],g=e[0],d=e[1],o=0,s=1,f=g-u,m=d-l,h;if(h=r-u,!(!f&&h>0)){if(h/=f,f<0){if(h<o)return;h<s&&(s=h)}else if(f>0){if(h>s)return;h>o&&(o=h)}if(h=i-u,!(!f&&h<0)){if(h/=f,f<0){if(h>s)return;h>o&&(o=h)}else if(f>0){if(h<o)return;h<s&&(s=h)}if(h=n-l,!(!m&&h>0)){if(h/=m,m<0){if(h<o)return;h<s&&(s=h)}else if(m>0){if(h>s)return;h>o&&(o=h)}if(h=a-l,!(!m&&h<0)){if(h/=m,m<0){if(h>s)return;h>o&&(o=h)}else if(m>0){if(h<o)return;h<s&&(s=h)}return o>0&&(t[0]=u+o*f,t[1]=l+o*m),s<1&&(e[0]=u+s*f,e[1]=l+s*m),!0}}}}}var Yt=1e9,de=-Yt;function Fe(t,e,r,n){function i(d,o){return t<=d&&d<=r&&e<=o&&o<=n}function a(d,o,s,f){var m=0,h=0;if(d==null||(m=u(d,s))!==(h=u(o,s))||g(d,o)<0^s>0)do f.point(m===0||m===3?t:r,m>1?n:e);while((m=(m+s+4)%4)!==h);else f.point(o[0],o[1])}function u(d,o){return K(d[0]-t)<I?o>0?0:3:K(d[0]-r)<I?o>0?2:1:K(d[1]-e)<I?o>0?1:0:o>0?3:2}function l(d,o){return g(d.x,o.x)}function g(d,o){var s=u(d,1),f=u(o,1);return s!==f?s-f:s===0?o[1]-d[1]:s===1?d[0]-o[0]:s===2?d[1]-o[1]:o[0]-d[0]}return function(d){var o=d,s=se(),f,m,h,b,v,L,w,A,y,R,z,D={point:G,lineStart:O,lineEnd:_,polygonStart:T,polygonEnd:P};function G(c,q){i(c,q)&&o.point(c,q)}function B(){for(var c=0,q=0,N=m.length;q<N;++q)for(var V=m[q],U=1,vt=V.length,et=V[0],dt,lt,wt=et[0],st=et[1];U<vt;++U)dt=wt,lt=st,et=V[U],wt=et[0],st=et[1],lt<=n?st>n&&(wt-dt)*(n-lt)>(st-lt)*(t-dt)&&++c:st<=n&&(wt-dt)*(n-lt)<(st-lt)*(t-dt)&&--c;return c}function T(){o=s,f=[],m=[],z=!0}function P(){var c=B(),q=z&&c,N=(f=At(f)).length;(q||N)&&(d.polygonStart(),q&&(d.lineStart(),a(null,null,1,d),d.lineEnd()),N&&ce(f,l,c,a,d),d.polygonEnd()),o=d,f=m=h=null}function O(){D.point=H,m&&m.push(h=[]),R=!0,y=!1,w=A=NaN}function _(){f&&(H(b,v),L&&y&&s.rejoin(),f.push(s.result())),D.point=G,y&&o.lineEnd()}function H(c,q){var N=i(c,q);if(m&&h.push([c,q]),R)b=c,v=q,L=N,R=!1,N&&(o.lineStart(),o.point(c,q));else if(N&&y)o.point(c,q);else{var V=[w=Math.max(de,Math.min(Yt,w)),A=Math.max(de,Math.min(Yt,A))],U=[c=Math.max(de,Math.min(Yt,c)),q=Math.max(de,Math.min(Yt,q))];Wn(V,U,t,e,r,n)?(y||(o.lineStart(),o.point(V[0],V[1])),o.point(U[0],U[1]),N||o.lineEnd(),z=!1):N&&(o.lineStart(),o.point(c,q),z=!1)}w=c,A=q,y=N}return D}}var _e,Be,he,me,Lt={sphere:W,point:W,lineStart:Rr,lineEnd:W,polygonStart:W,polygonEnd:W};function Rr(){Lt.point=zr,Lt.lineEnd=Lr}function Lr(){Lt.point=Lt.lineEnd=W}function zr(t,e){t*=C,e*=C,Be=t,he=E(e),me=M(e),Lt.point=qr}function qr(t,e){t*=C,e*=C;var r=E(e),n=M(e),i=K(t-Be),a=M(i),u=E(i),l=n*u,g=me*r-he*n*a,d=he*r+me*n*a;_e.add(Z(Y(l*l+g*g),d)),Be=t,he=r,me=n}function $n(t){return _e=new X,ut(t,Lt),+_e}var Te=[null,null],Ir={type:"LineString",coordinates:Te};function De(t,e){return Te[0]=t,Te[1]=e,$n(Ir)}function Ge(t,e){var r=t[0]*C,n=t[1]*C,i=e[0]*C,a=e[1]*C,u=M(n),l=E(n),g=M(a),d=E(a),o=u*M(r),s=u*E(r),f=g*M(i),m=g*E(i),h=2*Q(Y(Ae(a-n)+u*g*Ae(i-r))),b=E(h),v=h?function(L){var w=E(L*=h)/b,A=E(h-L)/b,y=A*o+w*f,R=A*s+w*m,z=A*l+w*d;return[Z(R,y)*J,Z(z,Y(y*y+R*R))*J]}:function(){return[r*J,n*J]};return v.distance=h,v}var jt=t=>t;var He=new X,Ke=new X,Yn,jn,We,$e,Et={point:W,lineStart:W,lineEnd:W,polygonStart:function(){Et.lineStart=Cr,Et.lineEnd=Fr},polygonEnd:function(){Et.lineStart=Et.lineEnd=Et.point=W,He.add(K(Ke)),Ke=new X},result:function(){var t=He/2;return He=new X,t}};function Cr(){Et.point=Nr}function Nr(t,e){Et.point=Jn,Yn=We=t,jn=$e=e}function Jn(t,e){Ke.add($e*t-We*e),We=t,$e=e}function Fr(){Jn(Yn,jn)}var Ye=Et;var zt=1/0,ge=zt,Jt=-zt,ve=Jt,_r={point:Br,lineStart:W,lineEnd:W,polygonStart:W,polygonEnd:W,result:function(){var t=[[zt,ge],[Jt,ve]];return Jt=ve=-(ge=zt=1/0),t}};function Br(t,e){t<zt&&(zt=t),t>Jt&&(Jt=t),e<ge&&(ge=e),e>ve&&(ve=e)}var qt=_r;var je=0,Je=0,Xt=0,xe=0,ye=0,It=0,Xe=0,Ze=0,Zt=0,On,Vn,mt,gt,pt={point:Mt,lineStart:Xn,lineEnd:Zn,polygonStart:function(){pt.lineStart=Gr,pt.lineEnd=Hr},polygonEnd:function(){pt.point=Mt,pt.lineStart=Xn,pt.lineEnd=Zn},result:function(){var t=Zt?[Xe/Zt,Ze/Zt]:It?[xe/It,ye/It]:Xt?[je/Xt,Je/Xt]:[NaN,NaN];return je=Je=Xt=xe=ye=It=Xe=Ze=Zt=0,t}};function Mt(t,e){je+=t,Je+=e,++Xt}function Xn(){pt.point=Tr}function Tr(t,e){pt.point=Dr,Mt(mt=t,gt=e)}function Dr(t,e){var r=t-mt,n=e-gt,i=Y(r*r+n*n);xe+=i*(mt+t)/2,ye+=i*(gt+e)/2,It+=i,Mt(mt=t,gt=e)}function Zn(){pt.point=Mt}function Gr(){pt.point=Kr}function Hr(){Un(On,Vn)}function Kr(t,e){pt.point=Un,Mt(On=mt=t,Vn=gt=e)}function Un(t,e){var r=t-mt,n=e-gt,i=Y(r*r+n*n);xe+=i*(mt+t)/2,ye+=i*(gt+e)/2,It+=i,i=gt*t-mt*e,Xe+=i*(mt+t),Ze+=i*(gt+e),Zt+=i*3,Mt(mt=t,gt=e)}var Oe=pt;function Se(t){this._context=t}Se.prototype={_radius:4.5,pointRadius:function(t){return this._radius=t,this},polygonStart:function(){this._line=0},polygonEnd:function(){this._line=NaN},lineStart:function(){this._point=0},lineEnd:function(){this._line===0&&this._context.closePath(),this._point=NaN},point:function(t,e){switch(this._point){case 0:{this._context.moveTo(t,e),this._point=1;break}case 1:{this._context.lineTo(t,e);break}default:{this._context.moveTo(t+this._radius,e),this._context.arc(t,e,this._radius,0,tt);break}}},result:W};var Ue=new X,Ve,Qn,tr,Ot,Vt,Ee={point:W,lineStart:function(){Ee.point=Wr},lineEnd:function(){Ve&&er(Qn,tr),Ee.point=W},polygonStart:function(){Ve=!0},polygonEnd:function(){Ve=null},result:function(){var t=+Ue;return Ue=new X,t}};function Wr(t,e){Ee.point=er,Qn=Ot=t,tr=Vt=e}function er(t,e){Ot-=t,Vt-=e,Ue.add(Y(Ot*Ot+Vt*Vt)),Ot=t,Vt=e}var Qe=Ee;var nr,be,rr,ir,Ct=class{constructor(e){this._append=e==null?or:$r(e),this._radius=4.5,this._=""}pointRadius(e){return this._radius=+e,this}polygonStart(){this._line=0}polygonEnd(){this._line=NaN}lineStart(){this._point=0}lineEnd(){this._line===0&&(this._+="Z"),this._point=NaN}point(e,r){switch(this._point){case 0:{this._append`M${e},${r}`,this._point=1;break}case 1:{this._append`L${e},${r}`;break}default:{if(this._append`M${e},${r}`,this._radius!==rr||this._append!==be){let n=this._radius,i=this._;this._="",this._append`m0,${n}a${n},${n} 0 1,1 0,${-2*n}a${n},${n} 0 1,1 0,${2*n}z`,rr=n,be=this._append,ir=this._,this._=i}this._+=ir;break}}}result(){let e=this._;return this._="",e.length?e:null}};function or(t){let e=1;this._+=t[0];for(let r=t.length;e<r;++e)this._+=arguments[e]+t[e]}function $r(t){let e=Math.floor(t);if(!(e>=0))throw new RangeError(`invalid digits: ${t}`);if(e>15)return or;if(e!==nr){let r=10**e;nr=e,be=function(i){let a=1;this._+=i[0];for(let u=i.length;a<u;++a)this._+=Math.round(arguments[a]*r)/r+i[a]}}return be}function tn(t,e){let r=3,n=4.5,i,a;function u(l){return l&&(typeof n=="function"&&a.pointRadius(+n.apply(this,arguments)),ut(l,i(a))),a.result()}return u.area=function(l){return ut(l,i(Ye)),Ye.result()},u.measure=function(l){return ut(l,i(Qe)),Qe.result()},u.bounds=function(l){return ut(l,i(qt)),qt.result()},u.centroid=function(l){return ut(l,i(Oe)),Oe.result()},u.projection=function(l){return arguments.length?(i=l==null?(t=null,jt):(t=l).stream,u):t},u.context=function(l){return arguments.length?(a=l==null?(e=null,new Ct(r)):new Se(e=l),typeof n!="function"&&a.pointRadius(n),u):e},u.pointRadius=function(l){return arguments.length?(n=typeof l=="function"?l:(a.pointRadius(+l),+l),u):n},u.digits=function(l){if(!arguments.length)return r;if(l==null)r=null;else{let g=Math.floor(l);if(!(g>=0))throw new RangeError(`invalid digits: ${l}`);r=g}return e===null&&(a=new Ct(r)),u},u.projection(t).digits(r).context(e)}function Ut(t){return function(e){var r=new en;for(var n in t)r[n]=t[n];return r.stream=e,r}}function en(){}en.prototype={constructor:en,point:function(t,e){this.stream.point(t,e)},sphere:function(){this.stream.sphere()},lineStart:function(){this.stream.lineStart()},lineEnd:function(){this.stream.lineEnd()},polygonStart:function(){this.stream.polygonStart()},polygonEnd:function(){this.stream.polygonEnd()}};function nn(t,e,r){var n=t.clipExtent&&t.clipExtent();return t.scale(150).translate([0,0]),n!=null&&t.clipExtent(null),ut(r,t.stream(qt)),e(qt.result()),n!=null&&t.clipExtent(n),t}function rn(t,e,r){return nn(t,function(n){var i=e[1][0]-e[0][0],a=e[1][1]-e[0][1],u=Math.min(i/(n[1][0]-n[0][0]),a/(n[1][1]-n[0][1])),l=+e[0][0]+(i-u*(n[1][0]+n[0][0]))/2,g=+e[0][1]+(a-u*(n[1][1]+n[0][1]))/2;t.scale(150*u).translate([l,g])},r)}function ar(t,e,r){return rn(t,[[0,0],e],r)}function ur(t,e,r){return nn(t,function(n){var i=+e,a=i/(n[1][0]-n[0][0]),u=(i-a*(n[1][0]+n[0][0]))/2,l=-a*n[0][1];t.scale(150*a).translate([u,l])},r)}function lr(t,e,r){return nn(t,function(n){var i=+e,a=i/(n[1][1]-n[0][1]),u=-a*n[0][0],l=(i-a*(n[1][1]+n[0][1]))/2;t.scale(150*a).translate([u,l])},r)}var sr=16,Yr=M(30*C);function on(t,e){return+e?Jr(t,e):jr(t)}function jr(t){return Ut({point:function(e,r){e=t(e,r),this.stream.point(e[0],e[1])}})}function Jr(t,e){function r(n,i,a,u,l,g,d,o,s,f,m,h,b,v){var L=d-n,w=o-i,A=L*L+w*w;if(A>4*e&&b--){var y=u+f,R=l+m,z=g+h,D=Y(y*y+R*R+z*z),G=Q(z/=D),B=K(K(z)-1)<I||K(a-s)<I?(a+s)/2:Z(R,y),T=t(B,G),P=T[0],O=T[1],_=P-n,H=O-i,c=w*_-L*H;(c*c/A>e||K((L*_+w*H)/A-.5)>.3||u*f+l*m+g*h<Yr)&&(r(n,i,a,u,l,g,P,O,B,y/=D,R/=D,z,b,v),v.point(P,O),r(P,O,B,y,R,z,d,o,s,f,m,h,b,v))}}return function(n){var i,a,u,l,g,d,o,s,f,m,h,b,v={point:L,lineStart:w,lineEnd:y,polygonStart:function(){n.polygonStart(),v.lineStart=R},polygonEnd:function(){n.polygonEnd(),v.lineStart=w}};function L(G,B){G=t(G,B),n.point(G[0],G[1])}function w(){s=NaN,v.point=A,n.lineStart()}function A(G,B){var T=ht([G,B]),P=t(G,B);r(s,f,o,m,h,b,s=P[0],f=P[1],o=G,m=T[0],h=T[1],b=T[2],sr,n),n.point(s,f)}function y(){v.point=L,n.lineEnd()}function R(){w(),v.point=z,v.lineEnd=D}function z(G,B){A(i=G,B),a=s,u=f,l=m,g=h,d=b,v.point=A}function D(){r(s,f,o,m,h,b,a,u,i,l,g,d,sr,n),v.lineEnd=y,y()}return v}}var Xr=Ut({point:function(t,e){this.stream.point(t*C,e*C)}});function Zr(t){return Ut({point:function(e,r){var n=t(e,r);return this.stream.point(n[0],n[1])}})}function Or(t,e,r,n,i){function a(u,l){return u*=n,l*=i,[e+t*u,r-t*l]}return a.invert=function(u,l){return[(u-e)/t*n,(r-l)/t*i]},a}function fr(t,e,r,n,i,a){if(!a)return Or(t,e,r,n,i);var u=M(a),l=E(a),g=u*t,d=l*t,o=u/t,s=l/t,f=(l*r-u*e)/t,m=(l*e+u*r)/t;function h(b,v){return b*=n,v*=i,[g*b-d*v+e,r-d*b-g*v]}return h.invert=function(b,v){return[n*(o*b-s*v+f),i*(m-s*b-o*v)]},h}function an(t){return Vr(function(){return t})()}function Vr(t){var e,r=150,n=480,i=250,a=0,u=0,l=0,g=0,d=0,o,s=0,f=1,m=1,h=null,b=Ne,v=null,L,w,A,y=jt,R=.5,z,D,G,B,T;function P(c){return G(c[0]*C,c[1]*C)}function O(c){return c=G.invert(c[0],c[1]),c&&[c[0]*J,c[1]*J]}P.stream=function(c){return B&&T===c?B:B=Xr(Zr(o)(b(z(y(T=c)))))},P.preclip=function(c){return arguments.length?(b=c,h=void 0,H()):b},P.postclip=function(c){return arguments.length?(y=c,v=L=w=A=null,H()):y},P.clipAngle=function(c){return arguments.length?(b=+c?Kn(h=c*C):(h=null,Ne),H()):h*J},P.clipExtent=function(c){return arguments.length?(y=c==null?(v=L=w=A=null,jt):Fe(v=+c[0][0],L=+c[0][1],w=+c[1][0],A=+c[1][1]),H()):v==null?null:[[v,L],[w,A]]},P.scale=function(c){return arguments.length?(r=+c,_()):r},P.translate=function(c){return arguments.length?(n=+c[0],i=+c[1],_()):[n,i]},P.center=function(c){return arguments.length?(a=c[0]%360*C,u=c[1]%360*C,_()):[a*J,u*J]},P.rotate=function(c){return arguments.length?(l=c[0]%360*C,g=c[1]%360*C,d=c.length>2?c[2]%360*C:0,_()):[l*J,g*J,d*J]},P.angle=function(c){return arguments.length?(s=c%360*C,_()):s*J},P.reflectX=function(c){return arguments.length?(f=c?-1:1,_()):f<0},P.reflectY=function(c){return arguments.length?(m=c?-1:1,_()):m<0},P.precision=function(c){return arguments.length?(z=on(D,R=c*c),H()):Y(R)},P.fitExtent=function(c,q){return rn(P,c,q)},P.fitSize=function(c,q){return ar(P,c,q)},P.fitWidth=function(c,q){return ur(P,c,q)},P.fitHeight=function(c,q){return lr(P,c,q)};function _(){var c=fr(r,0,0,f,m,s).apply(null,e(a,u)),q=fr(r,n-c[0],i-c[1],f,m,s);return o=Bn(l,g,d),D=$t(e,q),G=$t(o,D),z=on(D,R),H()}function H(){return B=T=null,P}return function(){return e=t.apply(this,arguments),P.invert=e.invert&&O,_()}}function cr(t){return function(e,r){var n=Y(e*e+r*r),i=t(n),a=E(i),u=M(i);return[Z(e*a,n*u),Q(n&&r*a/n)]}}function un(t,e){return[M(e)*E(t),E(e)]}un.invert=cr(Q);function ln(){return an(un).scale(249.5).clipAngle(90+I)}function sn(t){return t}function we(t){if(t==null)return sn;var e,r,n=t.scale[0],i=t.scale[1],a=t.translate[0],u=t.translate[1];return function(l,g){g||(e=r=0);var d=2,o=l.length,s=new Array(o);for(s[0]=(e+=l[0])*n+a,s[1]=(r+=l[1])*i+u;d<o;)s[d]=l[d],++d;return s}}function pr(t,e){for(var r,n=t.length,i=n-e;i<--n;)r=t[i],t[i++]=t[n],t[n]=r}function fn(t,e){return typeof e=="string"&&(e=t.objects[e]),e.type==="GeometryCollection"?{type:"FeatureCollection",features:e.geometries.map(function(r){return dr(t,r)})}:dr(t,e)}function dr(t,e){var r=e.id,n=e.bbox,i=e.properties==null?{}:e.properties,a=cn(t,e);return r==null&&n==null?{type:"Feature",properties:i,geometry:a}:n==null?{type:"Feature",id:r,properties:i,geometry:a}:{type:"Feature",id:r,bbox:n,properties:i,geometry:a}}function cn(t,e){var r=we(t.transform),n=t.arcs;function i(o,s){s.length&&s.pop();for(var f=n[o<0?~o:o],m=0,h=f.length;m<h;++m)s.push(r(f[m],m));o<0&&pr(s,h)}function a(o){return r(o)}function u(o){for(var s=[],f=0,m=o.length;f<m;++f)i(o[f],s);return s.length<2&&s.push(s[0]),s}function l(o){for(var s=u(o);s.length<4;)s.push(s[0]);return s}function g(o){return o.map(l)}function d(o){var s=o.type,f;switch(s){case"GeometryCollection":return{type:s,geometries:o.geometries.map(d)};case"Point":f=a(o.coordinates);break;case"MultiPoint":f=o.coordinates.map(a);break;case"LineString":f=u(o.arcs);break;case"MultiLineString":f=o.arcs.map(u);break;case"Polygon":f=g(o.arcs);break;case"MultiPolygon":f=o.arcs.map(g);break;default:return null}return{type:s,coordinates:f}}return d(e)}
/* ===========================================================================
 * Daten der Weltkugel
 *
 * ZAHLEN: Statistisches Bundesamt (Destatis), GENESIS-Tabelle 12711-0008
 * „Wanderungen zwischen Deutschland und dem Ausland: Deutschland, Jahre,
 * Nationalität, Herkunfts-/Zielländer“. Gezeigt werden die Fortzüge DEUTSCHER
 * Staatsangehöriger 2025, daneben 2024 und der Wanderungssaldo. Abruf:
 * 15.10.2026 (Tabellenstand 21.09.2026). Die Gesamtsumme 288.579 stimmt mit
 * der Pressemitteilung überein.
 *
 * WICHTIG: Bei 134.804 der 288.579 Fortzüge (46,7 %) ist das Zielland
 * „ungeklärt / ohne Angabe“, bei weiteren 3.067 „unbekanntes Ausland“. Die
 * Länderwerte sind deshalb Mindestwerte der erfassten Ziele.
 *
 * Neue Zahlen eintragen: nur die Werte f25/f24/saldo in ZIELLAENDER ändern.
 * `rang` ist die Platzierung unter den namentlich ausgewiesenen Zielländern.
 *
 * GESCHICHTEN: ausnahmslos FIKTIVE Beispiele (Platzhalter bis zur Einreichung
 * echter Geschichten). Die handgeschriebenen stehen zuerst, danach erzeugt
 * `geschichte()` deterministisch weitere. Echte Einreichungen später hier
 * einspeisen und die Kennzeichnung `fiktiv` entfernen.
 * ========================================================================= */

const STAND_ZAHLEN = {
  jahr: 2025,
  quelle: 'Statistisches Bundesamt, GENESIS-Tabelle 12711-0008',
  url: 'https://www-genesis.destatis.de/datenbank/online/table/12711-0008',
  gesamt: 288579,
  ohneZielland: 134804,
  stand: '21.09.2026',
};

/* id = ISO-3166 numerisch (wie world-atlas), point = [Länge, Breite] des Markers, zoom = Kamera */
const ZIELLAENDER = [
  { id: '756', name: 'Schweiz', point: [8.6, 47], zoom: 2.1, rang: 1, f25: 22730, f24: 20695, saldo: -14159 },
  { id: '040', name: 'Österreich', point: [14.2, 47.6], zoom: 2.1, rang: 2, f25: 13549, f24: 13308, saldo: -6699 },
  { id: '724', name: 'Spanien', point: [-3.7, 40.4], zoom: 1.6, rang: 3, f25: 9676, f24: 8869, saldo: -4401 },
  { id: '840', name: 'USA', point: [-97, 39], center: [-97, 38.5], zoom: 1.12, rang: 4, f25: 8860, f24: 9307, saldo: -1388 },
  { id: '250', name: 'Frankreich', point: [2.4, 46.6], zoom: 1.6, rang: 5, f25: 5748, f24: 5543, saldo: -1575 },
  { id: '792', name: 'Türkei', point: [35, 39], zoom: 1.6, rang: 6, f25: 5371, f24: 5203, saldo: 55 },
  { id: '616', name: 'Polen', point: [19.4, 52], zoom: 1.9, rang: 7, f25: 4942, f24: 4300, saldo: -3222 },
  { id: '826', name: 'Vereinigtes Königreich', point: [-2, 53.2], zoom: 1.7, rang: 8, f25: 4444, f24: 4450, saldo: -1170 },
  { id: '380', name: 'Italien', point: [12.5, 42.5], zoom: 1.7, rang: 9, f25: 3735, f24: 3442, saldo: -1781 },
  { id: '528', name: 'Niederlande', point: [5.3, 52.2], zoom: 2.3, rang: 10, f25: 3600, f24: 3674, saldo: -1152 },
  { id: '784', name: 'Vereinigte Arabische Emirate', point: [54.4, 24.3], zoom: 2.3, rang: 11, f25: 3410, f24: 2674, saldo: -2129 },
  { id: '643', name: 'Russland', point: [37.6, 55.75], center: [62, 58], zoom: 1.12, rang: 12, f25: 3306, f24: 3210, saldo: 704 },
  { id: '208', name: 'Dänemark', point: [10, 56], zoom: 2.3, rang: 13, f25: 3120, f24: 2857, saldo: -1970 },
  { id: '036', name: 'Australien', point: [134, -25], center: [134, -25], zoom: 1.12, rang: 14, f25: 3087, f24: 2905, saldo: -1058 },
  { id: '764', name: 'Thailand', point: [100.9, 15.9], zoom: 1.7, rang: 15, f25: 2894, f24: 2314, saldo: -1464 },
  /* Außerhalb der Top 15, aus dem ersten Entwurf übernommen (ebenfalls Destatis). */
  { id: '752', name: 'Schweden', point: [15, 62], zoom: 1.5, rang: null, f25: 2538, f24: 2478, saldo: -1302 },
  { id: '124', name: 'Kanada', point: [-106, 56], center: [-100, 56], zoom: 1.12, rang: null, f25: 1841, f24: 2004, saldo: -373 },
];

/* Weitere Ländernamen für Tooltips (world-atlas liefert nur englische Namen). */
const LAENDERNAMEN = { 276: 'Deutschland', 392: 'Japan' };

/* Orte je Zielland für die erzeugten Beispielgeschichten. */
const ORTE = {
  756: ['Zürich', 'Basel', 'Bern', 'Luzern', 'St. Gallen', 'Genf', 'Lausanne'],
  '040': ['Wien', 'Salzburg', 'Graz', 'Innsbruck', 'Linz'],
  724: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Palma'],
  840: ['Boston', 'Seattle', 'New York', 'Austin', 'Chicago', 'San Francisco', 'Atlanta'],
  250: ['Paris', 'Lyon', 'Straßburg', 'Toulouse', 'Nizza'],
  792: ['Istanbul', 'Izmir', 'Antalya', 'Ankara'],
  616: ['Warschau', 'Breslau', 'Krakau', 'Danzig', 'Posen'],
  826: ['London', 'Manchester', 'Edinburgh', 'Bristol', 'Cambridge'],
  380: ['Mailand', 'Rom', 'Bologna', 'Turin', 'Florenz'],
  528: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven', 'Den Haag'],
  784: ['Dubai', 'Abu Dhabi'],
  643: ['Moskau', 'Sankt Petersburg'],
  208: ['Kopenhagen', 'Aarhus', 'Odense'],
  '036': ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
  764: ['Bangkok', 'Chiang Mai', 'Phuket'],
  752: ['Stockholm', 'Göteborg', 'Malmö'],
  124: ['Toronto', 'Vancouver', 'Montréal', 'Calgary'],
};

/* Handgeschriebene Beispiele: [Name, Alter, Beruf, Herkunft, Grund, Text] */
const HANDGESCHRIEBEN = {
  756: [
    ['Lena Hartmann', 29, 'Ärztin', 'Hannover', 'Mehr Zeit für Patientinnen und Patienten', 'In Zürich findet Lena im Klinikalltag mehr Zeit für die Menschen, die sie behandelt.'],
    ['Jonas Weber', 34, 'Ingenieur', 'Dresden', 'Neue berufliche Perspektiven', 'Jonas arbeitet in Basel an einem Projekt, für das er in Dresden keine passende Stelle fand.'],
    ['Mira Seidel', 27, 'Pflegefachkraft', 'Köln', 'Planbare Arbeitszeiten', 'Mira erhofft sich in Bern verlässlichere Dienste und mehr Raum für ihr Privatleben.'],
    ['Tobias Kern', 41, 'Softwareentwickler', 'Berlin', 'Forschung und Entwicklung', 'Tobias ist für ein kleines Forschungsteam nach Lausanne gezogen.'],
    ['Nora Beck', 32, 'Architektin', 'Hamburg', 'Ein neues Projekt', 'Nora beginnt in Luzern eine Arbeit, die sie schon lange ausprobieren wollte.'],
    ['Emil Vogt', 38, 'Lehrer', 'Freiburg', 'Nähe zur Familie', 'Emil lebt nun in St. Gallen, wo ein Teil seiner Familie schon wohnt.'],
  ],
  '040': [
    ['Amina Rahman', 31, 'Pflegefachkraft', 'Essen', 'Beruflicher Wechsel', 'Amina hat in Wien eine neue Aufgabe in der Pflege übernommen.'],
    ['Felix Brandt', 28, 'Handwerker', 'München', 'Selbstständigkeit', 'Felix baut in Salzburg seinen eigenen kleinen Betrieb auf.'],
    ['Sarah Lindner', 36, 'Wissenschaftlerin', 'Leipzig', 'Forschungsstelle', 'Sarah setzt ihre Forschungsarbeit an einem Institut in Graz fort.'],
    ['Paul Krüger', 43, 'Designer', 'Düsseldorf', 'Familie und Arbeit', 'Paul verbindet in Innsbruck einen neuen Auftrag mit mehr Nähe zu seiner Familie.'],
    ['Jule Neumann', 26, 'Erzieherin', 'Bremen', 'Neuanfang', 'Jule hat sich für einen Neustart in Wien entschieden.'],
  ],
  840: [
    ['Malik Rahman', 33, 'Ingenieur', 'Dortmund', 'Technologieprojekt', 'Malik arbeitet in Boston an einer neuen technischen Anwendung.'],
    ['Hannah Vogt', 30, 'Biologin', 'Heidelberg', 'Forschung', 'Hannah hat ein befristetes Forschungsprojekt in Seattle angenommen.'],
    ['Leon Berger', 35, 'Gründer', 'Stuttgart', 'Unternehmensaufbau', 'Leon möchte seine Idee in San Francisco zu einem Unternehmen machen.'],
    ['Sibel Yılmaz', 29, 'Produktdesignerin', 'Berlin', 'Internationales Team', 'Sibel arbeitet jetzt in New York mit Menschen aus vielen Ländern.'],
    ['Tom Reuter', 42, 'IT-Spezialist', 'Kassel', 'Neue Aufgabe', 'Tom übernimmt in Chicago eine neue technische Verantwortung.'],
    ['Elisa Winter', 27, 'Musikerin', 'Bonn', 'Künstlerisches Projekt', 'Elisa ist für ein gemeinsames Musikprojekt nach Los Angeles gegangen.'],
    ['David Schulte', 39, 'Arzt', 'Münster', 'Klinische Forschung', 'David verbindet in Philadelphia Klinikarbeit und Forschung.'],
    ['Maja Richter', 31, 'Journalistin', 'Potsdam', 'Neue Perspektiven', 'Maja berichtet von Washington aus über ein neues Themengebiet.'],
  ],
  724: [
    ['Clara Hoffmann', 32, 'Übersetzerin', 'Berlin', 'Arbeit und Alltag', 'Clara lebt in Madrid und arbeitet weiter mit Kundinnen und Kunden in Deutschland.'],
    ['Ben Fischer', 40, 'Koch', 'Frankfurt', 'Eigenes Restaurant', 'Ben eröffnet in Valencia ein kleines Restaurant.'],
    ['Nina Albrecht', 28, 'Grafikerin', 'Kiel', 'Neuer Lebensort', 'Nina hat Barcelona zu ihrem neuen Zuhause gemacht.'],
    ['Lukas Werner', 37, 'Lehrer', 'Augsburg', 'Familie', 'Lukas ist mit seiner Familie nach Sevilla gezogen.'],
  ],
  752: [
    ['Frederik Lange', 34, 'Entwickler', 'Hamburg', 'Neues Team', 'Frederik arbeitet in Stockholm an digitalen Diensten.'],
    ['Alina Roth', 30, 'Ärztin', 'Dresden', 'Arbeitsalltag', 'Alina hat eine neue Stelle in Göteborg angenommen.'],
    ['Jakob Hansen', 38, 'Tischler', 'Lübeck', 'Familie und Natur', 'Jakob baut sich mit seiner Familie in Malmö einen neuen Alltag auf.'],
  ],
  124: [
    ['Sofia Meier', 29, 'Forscherin', 'Tübingen', 'Forschungsprojekt', 'Sofia arbeitet vorübergehend an einer Universität in Toronto.'],
    ['Niklas Baum', 36, 'Elektriker', 'Magdeburg', 'Berufliche Chance', 'Niklas hat in Vancouver einen neuen Betrieb gefunden.'],
    ['Romy Adler', 33, 'Fotografin', 'Berlin', 'Neuer Blick', 'Romy entwickelt in Montréal ein längeres Fotoprojekt.'],
    ['Jan Petersen', 41, 'Umwelttechniker', 'Flensburg', 'Neue Aufgabe', 'Jan arbeitet in Calgary an einer technischen Lösung für Energieanlagen.'],
  ],
};

/* ---------------------------------------------------------------------------
 * Erzeugte Beispielgeschichten (deterministisch: gleiche Nummer = gleiche Person)
 * ------------------------------------------------------------------------- */

const VORNAMEN_W = ['Lea', 'Emma', 'Johanna', 'Katharina', 'Marie', 'Pia', 'Greta', 'Frieda', 'Selin', 'Lisa', 'Anna', 'Theresa', 'Julia', 'Laura', 'Paula', 'Svenja', 'Carla', 'Ida', 'Merle', 'Zeynep', 'Larissa', 'Mara', 'Helena', 'Vera', 'Leonie', 'Charlotte', 'Miriam', 'Tessa'];
const VORNAMEN_M = ['Max', 'Noah', 'Finn', 'Moritz', 'Philipp', 'Daniel', 'Samuel', 'Kilian', 'Henrik', 'Oskar', 'Timo', 'Yusuf', 'Mehmet', 'Sebastian', 'Fabian', 'Anton', 'Lars', 'Matthias', 'Dennis', 'Robin', 'Erik', 'Julian', 'Marco', 'Stefan', 'Alexander', 'Nico', 'Hendrik', 'Johannes'];
const NACHNAMEN = ['Schneider', 'Wagner', 'Becker', 'Schäfer', 'Koch', 'Bauer', 'Klein', 'Wolf', 'Schröder', 'Schwarz', 'Zimmermann', 'Braun', 'Hofmann', 'Hartwig', 'Lorenz', 'Keller', 'Jung', 'Engel', 'Pohl', 'Sommer', 'Arnold', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Möller', 'Graf', 'Busch', 'Vogel', 'Dietrich', 'Ziegler', 'Haas'];
const HERKUNFT = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Kiel', 'Rostock', 'Erfurt', 'Magdeburg', 'Freiburg', 'Kassel'];
/* [männlich, weiblich] */
const BERUFE = [
  ['Softwareentwickler', 'Softwareentwicklerin'], ['Ingenieur', 'Ingenieurin'], ['Arzt', 'Ärztin'], ['Pflegefachmann', 'Pflegefachfrau'],
  ['Lehrer', 'Lehrerin'], ['Elektriker', 'Elektrikerin'], ['Architekt', 'Architektin'], ['Physiker', 'Physikerin'],
  ['Koch', 'Köchin'], ['Tischler', 'Tischlerin'], ['Designer', 'Designerin'], ['Journalist', 'Journalistin'],
  ['Mechatroniker', 'Mechatronikerin'], ['Chemiker', 'Chemikerin'], ['Buchhalter', 'Buchhalterin'], ['Physiotherapeut', 'Physiotherapeutin'],
  ['Erzieher', 'Erzieherin'], ['Gründer', 'Gründerin'], ['Datenanalyst', 'Datenanalystin'], ['Fotograf', 'Fotografin'],
  ['Landschaftsplaner', 'Landschaftsplanerin'], ['Rechtsanwalt', 'Rechtsanwältin'], ['Bäcker', 'Bäckerin'], ['Musiker', 'Musikerin'],
  ['Apotheker', 'Apothekerin'], ['Projektmanager', 'Projektmanagerin'], ['Zahnarzt', 'Zahnärztin'], ['Logistiker', 'Logistikerin'],
];
/* {n} Vorname, {o} Ort im Zielland, {h} Herkunft */
const GRUENDE = [
  ['Neue berufliche Perspektiven', '{n} hat in {o} eine Stelle gefunden, die in {h} so nicht zu haben war.'],
  ['Ein neues Projekt', '{n} arbeitet in {o} an einem Projekt, das {n2} schon lange machen wollte.'],
  ['Nähe zur Familie', 'Ein Teil von {n}s Familie lebt in der Nähe von {o}. Der Umzug fühlte sich richtig an.'],
  ['Planbare Arbeitszeiten', '{n} erhofft sich in {o} verlässlichere Dienste und mehr Zeit für Privates.'],
  ['Selbstständigkeit', '{n} baut in {o} einen eigenen kleinen Betrieb auf.'],
  ['Forschung', '{n} setzt die Forschungsarbeit an einem Institut in {o} fort.'],
  ['Neuanfang', 'Nach Jahren in {h} wollte {n} etwas ganz Neues beginnen, jetzt in {o}.'],
  ['Internationales Team', '{n} arbeitet in {o} mit Kolleginnen und Kollegen aus vielen Ländern.'],
  ['Lebensqualität', '{n} schätzt in {o} den Alltag, die Wege und das Klima.'],
  ['Weiterbildung', '{n} nutzt in {o} die Möglichkeit, sich fachlich weiterzuentwickeln.'],
  ['Partnerschaft', '{n} ist der Liebe wegen nach {o} gezogen und hat dort Arbeit gefunden.'],
  ['Neue Aufgabe', '{n} hat in {o} eine Verantwortung übernommen, die in {h} nicht frei war.'],
  ['Abenteuerlust', '{n} wollte ein Land außerhalb Deutschlands kennenlernen und blieb in {o}.'],
  ['Familiengründung', '{n} baut sich mit der Familie in {o} einen neuen Alltag auf.'],
];

/* Kleiner deterministischer Zufallsgenerator (mulberry32). */
function zufall(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wahl = (r, liste) => liste[Math.floor(r() * liste.length)];

/** i-te erzeugte Beispielgeschichte für ein Land. */
function erzeugeGeschichte(land, i) {
  const r = zufall(parseInt(land.id, 10) * 7919 + i * 104729);
  const weiblich = r() < 0.5;
  const vor = wahl(r, weiblich ? VORNAMEN_W : VORNAMEN_M);
  const nach = wahl(r, NACHNAMEN);
  const beruf = wahl(r, BERUFE)[weiblich ? 1 : 0];
  const herkunft = wahl(r, HERKUNFT);
  const ort = wahl(r, ORTE[land.id] || [land.name]);
  const [grund, vorlage] = wahl(r, GRUENDE);
  const text = vorlage
    .replace(/\{n2\}/g, weiblich ? 'sie' : 'er')
    .replace(/\{n\}/g, vor)
    .replace(/\{o\}/g, ort)
    .replace(/\{h\}/g, herkunft);
  return { name: vor + ' ' + nach, age: 23 + Math.floor(r() * 30), profession: beruf, origin: herkunft, city: ort, reason: grund, text };
}

/** Geschichte Nummer i (0-basiert) eines Ziellandes: erst handgeschriebene, dann erzeugte. */
function geschichte(land, i) {
  const hand = HANDGESCHRIEBEN[land.id] || [];
  if (i < hand.length) {
    const [name, age, profession, origin, reason, text] = hand[i];
    return { name, age, profession, origin, city: null, reason, text, fiktiv: true };
  }
  return { ...erzeugeGeschichte(land, i), fiktiv: true };
}

const ZIEL_NACH_ID = new Map(ZIELLAENDER.map((l) => [l.id, l]));

/**
 * Anzahl der Geschichten (= schwebende Kreise) eines Landes.
 *
 * DEMO: Solange es keine echten Einsendungen gibt, wächst die Zahl mit den
 * Fortzügen (rund eine Beispielgeschichte je 1.000 Fortzüge, mindestens die
 * handgeschriebenen, höchstens 24). Mit echten Einsendungen hier die Zahl der
 * tatsächlich veröffentlichten Geschichten je Land zurückgeben.
 */
function anzahlGeschichten(land) {
  /* Noch keine veröffentlichten Geschichten: keine Kreise. Mit echten Einsendungen hier die Zahl je Land zurückgeben. */
  return 0;
}

/* ===========================================================================
 * Weltkugel „Sie fehlen.“
 *
 * Läuft zusammen mit d3-core.js (d3-geo, topojson) und stories-data.js zu
 * globe.js zusammengesetzt: `node build.mjs`. Hier steht nur die Logik.
 *
 * Land anklicken -> die Kugel zoomt auf das Land, die Fortzugszahl 2025 steht
 * links oben. Im Land schweben Kreise, einer je Geschichte (mehr Geschichten =
 * mehr Kreise). Hover (Maus) vergrößert einen Kreis, Klick/Tippen öffnet das
 * Profil. Gleiches Verhalten am Desktop und am Handy.
 * ========================================================================= */

const SVG_NS = 'http://www.w3.org/2000/svg';
const BERLIN = [13.405, 52.52];
const MOBIL_MAX = 760;

const klemme = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const wickeln = (x) => (((x + 180) % 360) + 360) % 360 - 180;
const deZahl = (n) => n.toLocaleString('de-DE');
const RAD = Math.PI / 180;
/* Länder, die die Karte darüber nennt: sie leuchten beim Einblenden der Kugel zuerst. */
const LEAD = new Set(['756', '040', '724', '840']);

function svgEl(tag, cls) {
  const n = document.createElementNS(SVG_NS, tag);
  if (cls) n.setAttribute('class', cls);
  return n;
}

/** Veränderung 2025 gegenüber 2024 als Text, z. B. „+9,8 % gegenüber 2024“. */
function veraenderung(land) {
  const p = ((land.f25 - land.f24) / land.f24) * 100;
  const text = Math.abs(p).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (p >= 0 ? '+' : '−') + text + ' % gegenüber 2024';
}

function saldoText(land) {
  return 'Wanderungssaldo ' + (land.saldo < 0 ? '−' : '+') + deZahl(Math.abs(land.saldo));
}

const initialen = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/* Routen von Berlin zu jedem Zielland (Großkreisbögen). */
const ROUTEN = ZIELLAENDER.map((land) => {
  const bogen = Ge(BERLIN, land.point);
  return {
    id: land.id,
    point: land.point,
    geometry: { type: 'LineString', coordinates: Array.from({ length: 65 }, (_, n) => bogen(n / 64)) },
  };
});

/* --- Geometrie-Helfer: Hauptlandmasse eines Landes ------------------------ */

function ringBox(ring) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

/** Größtes Teilpolygon (Festland ohne Übersee-Gebiete): { rings, box }. */
function hauptland(feature) {
  const g = feature.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let best = null;
  let bestArea = -1;
  for (const rings of polys) {
    const b = ringBox(rings[0]);
    const area = (b[2] - b[0]) * (b[3] - b[1]) * Math.cos((((b[1] + b[3]) / 2) * Math.PI) / 180);
    if (area > bestArea) {
      bestArea = area;
      best = { rings, box: b };
    }
  }
  return best;
}

function imRing(ring, x, y) {
  let drin = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
}

function imLand(rings, lon, lat) {
  if (!imRing(rings[0], lon, lat)) return false;
  for (let i = 1; i < rings.length; i++) if (imRing(rings[i], lon, lat)) return false;
  return true;
}

async function initStoriesGlobe(root) {
  const svg = root.querySelector('#globe-svg');
  const stage = root.querySelector('#stories-globe-map');
  const tooltip = root.querySelector('#globe-tooltip');
  const focus = root.querySelector('#globe-focus');
  const backBtn = root.querySelector('#globe-back');
  const empty = root.querySelector('#globe-empty');
  const dialog = document.querySelector('#story-dialog');
  const submitNote = root.querySelector('#story-submit-note');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const hint = root.querySelector('.globe-hint');

  /* --- Weltgeometrie laden ------------------------------------------------ */
  let topo;
  try {
    const res = await fetch('./assets/countries-110m.json');
    if (!res.ok) throw new Error('world geometry unavailable');
    topo = await res.json();
  } catch {
    hint.hidden = false;
    hint.textContent = 'Die Weltkarte konnte nicht geladen werden. Bitte die Seite neu laden.';
    return;
  }

  const features = fn(topo, topo.objects.countries).features;
  const featureById = new Map(features.map((f) => [String(f.id).padStart(3, '0'), f]));
  const countryName = (id) => ZIEL_NACH_ID.get(id)?.name || LAENDERNAMEN[id] || featureById.get(id)?.properties.name || id;
  const landCache = new Map();
  const mainland = (id) => {
    if (!landCache.has(id)) landCache.set(id, hauptland(featureById.get(id)));
    return landCache.get(id);
  };

  const projection = ln().clipAngle(90).precision(0.7);
  const pathGen = tn(projection);

  /* --- SVG-Gerüst ---------------------------------------------------------- */
  const sphere = svgEl('path', 'globe-sphere');
  const gCountries = svgEl('g', 'globe-countries');
  const gRoutes = svgEl('g', 'globe-routes');
  const gMarkers = svgEl('g', 'globe-markers');
  const gBubbles = svgEl('g', 'globe-bubbles');
  const gHot = svgEl('g', 'globe-hot');
  gHot.setAttribute('pointer-events', 'none');
  svg.append(sphere, gCountries, gRoutes, gMarkers, gBubbles, gHot);

  const countries = features.map((feature) => {
    const id = String(feature.id).padStart(3, '0');
    const element = svgEl('path', 'globe-country');
    element.dataset.countryId = id;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '-1');
    element.setAttribute('aria-label', countryName(id) + ' auswählen');
    if (LEAD.has(id)) element.classList.add('is-lead');
    gCountries.append(element);
    return { id, feature, element };
  });

  const routes = ROUTEN.map((route, index) => {
    const element = svgEl('path', 'globe-route');
    if (LEAD.has(route.id)) element.classList.add('is-lead');
    else element.style.transitionDelay = 150 + index * 90 + 'ms';
    gRoutes.append(element);
    return { ...route, element };
  });

  const origin = svgEl('circle', 'globe-marker globe-marker--origin');
  origin.setAttribute('r', '4.5');
  gMarkers.append(origin);

  const markers = ZIELLAENDER.map(({ id, point }, index) => {
    const element = svgEl('circle', 'globe-marker');
    if (LEAD.has(id)) element.classList.add('is-lead');
    else element.style.transitionDelay = 150 + index * 90 + 'ms';
    element.setAttribute('r', '3');
    gMarkers.append(element);
    return { id, point, element };
  });

  const HIT = 16;
  const hits = ZIELLAENDER.map(({ id, point, name }) => {
    const element = svgEl('circle', 'globe-hit-target');
    element.setAttribute('r', String(HIT));
    element.dataset.countryId = id;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '-1');
    element.setAttribute('aria-label', name + ' auswählen');
    gMarkers.append(element);
    return { id, point, element };
  });

  /* --- Zustand ------------------------------------------------------------- */
  let width = 0;
  let height = 0;
  let radius = 0;
  /* dx: seitlicher Versatz, t: 0 = Weltansicht (Kugel steigt von unten), 1 = Land mittig im Bild */
  const WELT = { lon: 11, lat: -5, zoom: 1, dx: 0, t: 0 };
  const view = { ...WELT };
  let savedView = null;
  let selected = null;
  let hovered = null;
  let drag = null;
  let frame = 0;
  let tweenFrame = 0;
  let tweenToken = 0;
  let bubbleData = [];
  let scrollRef = 0;
  /* Beim Hereinscrollen dreht sich die Kugel aus der Ferne auf Europa ein. */
  const INTRO_LON = -52;
  let introDone = reduce.matches;

  const facing = (point) => De(point, [view.lon, view.lat]) < Math.PI / 2 - 0.005;
  const mobileLayout = () => width <= MOBIL_MAX;
  /* Handy: Infokarte liegt unten im Bild, das Land bekommt den freien Platz darüber. */
  const MOBIL_KARTE = 176;
  const MOBIL_OBEN = 44;
  const anchorY = () => (mobileLayout() ? MOBIL_OBEN + (height - MOBIL_KARTE - MOBIL_OBEN) / 2 : height * 0.52);

  /** Marker unter dem Zeiger (Marker haben Vorrang vor Flächen). */
  function pickMarker(ev) {
    const box = svg.getBoundingClientRect();
    const x = ((ev.clientX - box.left) * width) / box.width;
    const y = ((ev.clientY - box.top) * height) / box.height;
    let best = null;
    let bestDist = HIT;
    for (const { id, point } of hits) {
      if (selected && selected !== id) continue;
      if (!facing(point)) continue;
      const [px, py] = projection(point);
      const dist = Math.hypot(px - x, py - y);
      if (dist < bestDist) {
        best = id;
        bestDist = dist;
      }
    }
    return best;
  }

  function applyProjection() {
    const r = radius * view.zoom;
    const ty = (1 - view.t) * (r + 10) + view.t * anchorY();
    projection.scale(r).translate([width / 2 + view.dx, ty]).rotate([-view.lon, -view.lat]);
  }

  function render() {
    frame = 0;
    if (!width || !height) return;
    applyProjection();
    stage.classList.toggle('has-selection', !!selected);
    sphere.setAttribute('d', pathGen({ type: 'Sphere' }) || '');

    for (const { id, feature, element } of countries) {
      const d = pathGen(feature) || '';
      element.setAttribute('d', d);
      element.setAttribute('tabindex', d ? '0' : '-1');
      element.classList.toggle('is-selected', id === selected);
      element.classList.toggle('is-hovered', id === hovered);
      element.classList.toggle('has-data', ZIEL_NACH_ID.has(id));
    }

    for (const route of routes) {
      route.element.setAttribute('d', pathGen(route.geometry) || '');
      route.element.classList.toggle('is-muted', !!selected && selected !== route.id);
      route.element.classList.toggle('is-selected', selected === route.id);
    }

    const berlinVisible = facing(BERLIN) && !selected;
    origin.style.display = berlinVisible ? '' : 'none';
    if (berlinVisible) {
      const [x, y] = projection(BERLIN);
      origin.setAttribute('cx', x);
      origin.setAttribute('cy', y);
    }

    for (const { id, point, element } of markers) {
      const show = facing(point) && !selected;
      element.style.display = show ? '' : 'none';
      if (show) {
        const [x, y] = projection(point);
        element.setAttribute('cx', x);
        element.setAttribute('cy', y);
      }
    }

    for (const { id, point, element } of hits) {
      const show = facing(point) && !selected;
      element.style.display = show ? '' : 'none';
      element.setAttribute('tabindex', show ? '0' : '-1');
      if (show) {
        const [x, y] = projection(point);
        element.setAttribute('cx', x);
        element.setAttribute('cy', y);
      }
    }
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  function resize() {
    width = Math.max(1, stage.clientWidth);
    height = Math.max(1, stage.clientHeight);
    radius = width * (mobileLayout() ? 0.66 : 0.52);
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    if (selected && !tweenFrame) {
      /* Zoom auf das Land neu rechnen, dann die Kreise neu legen. */
      Object.assign(view, cameraFor(selected));
      render();
      placeBubbles();
    } else schedule();
  }

  /* --- Tooltip (Weltansicht) ------------------------------------------------ */
  function hideTooltip() {
    hovered = null;
    tooltip.hidden = true;
    schedule();
  }

  function showTooltip(id, clientX, clientY) {
    if (drag?.moved || selected) return;
    if (!featureById.get(id)) return;
    hovered = id;
    const land = ZIEL_NACH_ID.get(id);
    tooltip.querySelector('strong').textContent = countryName(id);
    tooltip.querySelector('span').textContent = land
      ? deZahl(land.f25) + ' Fortzüge deutscher Staatsangehöriger 2025'
      : 'Länderwert nicht ausgewiesen';
    const box = stage.getBoundingClientRect();
    tooltip.style.left = klemme(clientX - box.left + 16, 12, width - 205) + 'px';
    tooltip.style.top = klemme(clientY - box.top - 70, 12, height - 76) + 'px';
    tooltip.hidden = false;
    schedule();
  }

  /* --- Kamera -------------------------------------------------------------- */
  function flyTo(target, done) {
    cancelAnimationFrame(tweenFrame);
    const token = ++tweenToken;
    const from = { ...view };
    const dLon = wickeln(target.lon - from.lon);
    const duration = reduce.matches ? 0 : 700;
    const t0 = performance.now();
    function step(now) {
      if (token !== tweenToken) return;
      const p = duration ? klemme((now - t0) / duration, 0, 1) : 1;
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      view.lon = wickeln(from.lon + dLon * e);
      view.lat = from.lat + (target.lat - from.lat) * e;
      /* Zoom exponentiell, damit er auch bei großen Sprüngen gleichmäßig wirkt. */
      view.zoom = from.zoom * Math.pow(target.zoom / from.zoom, e);
      view.dx = from.dx + (target.dx - from.dx) * e;
      view.t = from.t + (target.t - from.t) * e;
      render();
      if (p < 1) tweenFrame = requestAnimationFrame(step);
      else {
        tweenFrame = 0;
        done?.();
      }
    }
    tweenFrame = requestAnimationFrame(step);
  }

  /** Kamera, die das Land (Festland) groß und mittig zeigt. */
  function cameraFor(id) {
    const land = ZIEL_NACH_ID.get(id);
    const m = mainland(id);
    const [x0, y0, x1, y1] = m.box;
    const midLat = (y0 + y1) / 2;
    const centre = land?.center || [(x0 + x1) / 2, midLat];
    /* Winkelausdehnung des Landes (Grad), Breitenkreise verkürzt */
    const span = Math.max((x1 - x0) * Math.cos(midLat * RAD), y1 - y0) * RAD;
    const mobile = mobileLayout();
    const dx = mobile ? 0 : width * 0.13;
    const target = mobile ? Math.min(width * 0.88, (height - MOBIL_KARTE - MOBIL_OBEN) * 0.9) : Math.min(width * 0.46, height * 0.74);
    const zoom = klemme(target / (radius * span), 1.05, 16);
    return { lon: centre[0], lat: centre[1], zoom, dx, t: 1 };
  }

  /* --- Fokus-Anzeige (Land + Zahl) ---------------------------------------- */
  const fo = {
    eyebrow: focus.querySelector('.gf-eyebrow'),
    name: focus.querySelector('strong'),
    number: focus.querySelector('.gf-number'),
    unit: focus.querySelector('.gf-unit'),
    delta: focus.querySelector('.gf-delta'),
    count: focus.querySelector('.gf-count'),
  };

  function showFocus(id) {
    const land = ZIEL_NACH_ID.get(id);
    focus.hidden = false;
    backBtn.hidden = false;
    fo.name.textContent = countryName(id);
    if (land) {
      const n = anzahlGeschichten(land);
      fo.eyebrow.textContent = land.rang ? 'FORTZÜGE 2025 · PLATZ ' + land.rang : 'FORTZÜGE 2025';
      fo.number.textContent = deZahl(land.f25);
      fo.unit.textContent = 'deutsche Staatsangehörige zogen 2025 hierher fort';
      fo.delta.textContent = veraenderung(land) + ' · ' + saldoText(land);
      fo.count.textContent = n > 0 ? n + ' Geschichten · jeder Kreis eine Person, antippen zum Lesen' : 'Noch keine Geschichten veröffentlicht.';
      fo.number.hidden = fo.unit.hidden = fo.count.hidden = false;
      empty.hidden = true;
    } else {
      fo.eyebrow.textContent = 'KEIN LÄNDERWERT';
      fo.number.hidden = fo.unit.hidden = fo.count.hidden = true;
      fo.delta.textContent = 'Für dieses Land weist die Statistik keine Zahl aus.';
      empty.hidden = false;
    }
  }

  /* =========================================================================
   * Schwebende Kreise im Land
   * ======================================================================= */

  function clearBubbles() {
    gBubbles.replaceChildren();
    gHot.replaceChildren();
    bubbleData = [];
  }

  function openProfile(story, land) {
    dialog.querySelector('#story-dialog-title').textContent = story.name;
    dialog.querySelector('#story-dialog-meta').textContent = story.age + ' Jahre · ' + story.profession;
    dialog.querySelector('#story-dialog-route').textContent = story.origin + ' \u2192\uFE0E ' + (story.city ? story.city + ', ' : '') + land.name;
    dialog.querySelector('#story-dialog-reason').textContent = story.reason;
    dialog.querySelector('#story-dialog-text').textContent = story.text;
    dialog.showModal();
  }

  /** Legt die Kreise gleichmäßig verteilt in die Hauptlandmasse des gewählten Landes. */
  function placeBubbles() {
    clearBubbles();
    const land = ZIEL_NACH_ID.get(selected);
    if (!land) return;
    const m = mainland(selected);
    if (!m) return;
    applyProjection();
    const n = anzahlGeschichten(land);
    const rnd = zufall(parseInt(selected, 10) * 31 + 7);
    const mobile = mobileLayout();
    const minR = mobile ? 12 : 11;
    const maxR = mobile ? 26 : 34;

    /* freie Fläche: Bühne ohne den Textblock links oben */
    const sb = stage.getBoundingClientRect();
    /* gesperrte Bereiche: Infotext/-karte und Zurück-Knopf */
    const sperr = [focus, backBtn]
      .filter((el) => !el.hidden)
      .map((el) => {
        const b = el.getBoundingClientRect();
        return { x0: b.left - sb.left - 12, y0: b.top - sb.top - 12, x1: b.right - sb.left + 12, y1: b.bottom - sb.top + 12 };
      });
    const frei = (x, y, r) => sperr.every((a) => x + r < a.x0 || x - r > a.x1 || y + r < a.y0 || y - r > a.y1);

    const flaeche = pathGen.area({ type: 'Polygon', coordinates: m.rings }) || width * height * 0.1;
    let base = klemme(Math.sqrt((0.4 * Math.min(flaeche, width * height * 0.45)) / (n * Math.PI)), minR, maxR);
    const margin = 8;
    let platziert = [];

    const innen = (x, y, r) => {
      for (const [ox, oy] of [[0, 0], [r * 0.8, 0], [-r * 0.8, 0], [0, r * 0.8], [0, -r * 0.8]]) {
        const sx = x + ox;
        const sy = y + oy;
        const geo = projection.invert([sx, sy]);
        if (!geo) return false;
        const back = projection(geo);
        if (!back || Math.abs(back[0] - sx) > 1.5 || Math.abs(back[1] - sy) > 1.5) return false;
        if (!imLand(m.rings, geo[0], geo[1])) return false;
      }
      return true;
    };

    for (let versuch = 0; versuch < 8; versuch++) {
      platziert = [];
      const radien = Array.from({ length: n }, () => base * (0.78 + rnd() * 0.5)).sort((a, b) => b - a);
      for (const r of radien) {
        let ok = false;
        for (let k = 0; k < 500 && !ok; k++) {
          const x = margin + rnd() * (width - 2 * margin);
          const y = margin + rnd() * (height - 2 * margin);
          if (!frei(x, y, r) || !innen(x, y, r)) continue;
          if (platziert.some((p) => Math.hypot(p.x - x, p.y - y) < (p.r + r) * 1.1 + 2)) continue;
          platziert.push({ x, y, r });
          ok = true;
        }
      }
      if (platziert.length >= n) break;
      base = Math.max(minR * 0.7, base * 0.88);
    }

    platziert.forEach((p, i) => {
      const story = geschichte(land, i);
      const g = svgEl('g', 'gb');
      g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', story.name + ', ' + story.profession + ', Geschichte öffnen');
      const inn = svgEl('g', 'gb__in');
      inn.style.animationDelay = (reduce.matches ? 0 : 120 + i * 45) + 'ms';
      const fl = svgEl('g', 'gb__float');
      const amp = p.r * (0.3 + rnd() * 0.35);
      const ang = rnd() * Math.PI * 2;
      fl.style.setProperty('--ax', (Math.cos(ang) * amp).toFixed(1) + 'px');
      fl.style.setProperty('--ay', (Math.sin(ang) * amp).toFixed(1) + 'px');
      fl.style.setProperty('--bx', (Math.cos(ang + 2.1) * amp * 0.8).toFixed(1) + 'px');
      fl.style.setProperty('--by', (Math.sin(ang + 2.1) * amp * 0.8).toFixed(1) + 'px');
      fl.style.setProperty('--dur', (5 + rnd() * 5).toFixed(1) + 's');
      fl.style.setProperty('--delay', (-rnd() * 6).toFixed(1) + 's');
      const c = svgEl('circle', 'gb__c');
      c.setAttribute('r', p.r.toFixed(1));
      const t = svgEl('text', 'gb__t');
      t.textContent = initialen(story.name);
      t.style.fontSize = (p.r * 0.72).toFixed(1) + 'px';
      fl.append(c, t);
      inn.append(fl);
      g.append(inn);
      gBubbles.append(g);
      const data = { g, c, story, r: p.r };
      bubbleData.push(data);

      g.addEventListener('pointerenter', (ev) => {
        if (ev.pointerType === 'mouse') showHot(data);
      });
      g.addEventListener('pointerleave', () => hideHot(data));
      g.addEventListener('focus', () => showHot(data));
      g.addEventListener('blur', () => hideHot(data));
      g.addEventListener('click', () => {
        hideHot(data);
        openProfile(story, land);
      });
      g.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          openProfile(story, land);
        }
      });
    });
  }

  /** Vergrößerte Kopie des Kreises in der obersten Ebene (liegt über allen Nachbarn). */
  function showHot(data) {
    gHot.replaceChildren();
    const sb = svg.getBoundingClientRect();
    const cb = data.c.getBoundingClientRect();
    const x = ((cb.left + cb.width / 2 - sb.left) * width) / sb.width;
    const y = ((cb.top + cb.height / 2 - sb.top) * height) / sb.height;
    const r = Math.max(data.r * 1.55, 26);
    const g = svgEl('g', 'gh');
    g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
    const pop = svgEl('g', 'gh__pop');
    const c = svgEl('circle', 'gh__c');
    c.setAttribute('r', r.toFixed(1));
    const t = svgEl('text', 'gh__t');
    t.textContent = initialen(data.story.name);
    t.style.fontSize = (r * 0.72).toFixed(1) + 'px';
    pop.append(c, t);
    const oben = y > 90;
    const ly = oben ? -r - 12 : r + 22;
    const label = svgEl('g', 'gh__label');
    const n1 = svgEl('text', 'gh__name');
    n1.textContent = data.story.name;
    n1.setAttribute('y', String(ly));
    const n2 = svgEl('text', 'gh__job');
    n2.textContent = data.story.profession + ' · ' + data.story.age + ' · ' + data.story.origin;
    n2.setAttribute('y', String(ly + 16));
    if (oben) {
      n1.setAttribute('y', String(ly - 16));
      n2.setAttribute('y', String(ly));
    }
    label.append(n1, n2);
    g.append(pop, label);
    gHot.append(g);
    data.g.classList.add('is-hot');
  }

  function hideHot(data) {
    gHot.replaceChildren();
    data.g.classList.remove('is-hot');
  }

  /* --- Auswahl ------------------------------------------------------------- */
  function selectCountry(id) {
    if (!featureById.get(id) || !mainland(id)) return;
    hideTooltip();
    clearBubbles();
    if (!introDone) {
      introDone = true;
      view.lon = WELT.lon;
    }
    if (!savedView) savedView = { ...view };
    selected = id;
    empty.hidden = true;
    focus.hidden = true;
    backBtn.hidden = true;
    flyTo(cameraFor(id), () => {
      scrollRef = window.scrollY;
      showFocus(id);
      /* Fokus-Text steht jetzt im Layout, dann erst die Kreise legen. */
      placeBubbles();
    });
  }

  function deselect(sofort) {
    if (!selected) return;
    selected = null;
    clearBubbles();
    empty.hidden = true;
    focus.hidden = true;
    backBtn.hidden = true;
    const target = savedView || { ...WELT };
    savedView = null;
    if (sofort === true || reduce.matches) {
      cancelAnimationFrame(tweenFrame);
      tweenFrame = 0;
      tweenToken++;
      Object.assign(view, target);
      render();
    } else flyTo(target);
  }

  /* Weiterscrollen verlässt die Länderansicht von selbst: zurück zur drehbaren Weltkugel. */
  window.addEventListener(
    'scroll',
    () => {
      if (selected && !tweenFrame && Math.abs(window.scrollY - scrollRef) > 50) deselect();
    },
    { passive: true },
  );
  /* Auch am Seitenende (nichts mehr zu scrollen): Mausrad oder Wischen nach oben/unten verlässt die Länderansicht. */
  window.addEventListener(
    'wheel',
    (ev) => {
      if (selected && !tweenFrame && Math.abs(ev.deltaY) > 8 && !dialog.open) deselect();
    },
    { passive: true },
  );
  let touchY = null;
  stage.addEventListener(
    'touchstart',
    (ev) => {
      touchY = ev.touches[0].clientY;
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchmove',
    (ev) => {
      if (selected && !tweenFrame && touchY !== null && Math.abs(ev.touches[0].clientY - touchY) > 36) {
        touchY = null;
        deselect();
      }
    },
    { passive: true },
  );
  /* Ist die Kugel ganz aus dem Bild, wird sie unbemerkt zurückgesetzt. */
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && selected) deselect(true);
  }).observe(stage);

  /* --- Zeigerbedienung ------------------------------------------------------ */
  svg.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (ev.target.closest('.gb')) return; /* Kreise: nur Klick, kein Drehen */
    if (!introDone) {
      introDone = true;
      view.lon = WELT.lon;
    }
    cancelAnimationFrame(tweenFrame);
    tweenFrame = 0;
    tweenToken++;
    drag = {
      pointerId: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      lon: view.lon,
      lat: view.lat,
      moved: false,
      countryId: pickMarker(ev) || ev.target.closest('[data-country-id]')?.dataset.countryId,
    };
    svg.classList.add('is-dragging');
  });

  svg.addEventListener('pointermove', (ev) => {
    if (drag && ev.pointerId === drag.pointerId) {
      const dx = ev.clientX - drag.x;
      const dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (ev.pointerType === 'touch' && !drag.moved && Math.abs(dy) > Math.abs(dx) * 1.1) return;
      if (selected) {
        /* In der Länderansicht wird nicht gedreht (Zurück-Knopf oder Esc), Wischen bleibt Seitenscrollen. */
        drag.moved = true;
        return;
      }
      if (!drag.moved) {
        drag.moved = true;
        svg.setPointerCapture(ev.pointerId);
        hideTooltip();
      }
      view.lon = wickeln(drag.lon - dx * 0.22);
      view.lat = klemme(drag.lat + dy * 0.16, -80, 80);
      schedule();
      return;
    }
    if (ev.pointerType !== 'mouse' || selected) return;
    const id = pickMarker(ev) || ev.target.closest('[data-country-id]')?.dataset.countryId;
    if (id) showTooltip(id, ev.clientX, ev.clientY);
    else if (hovered) hideTooltip();
  });

  function endDrag(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    const moved = drag.moved;
    const id = drag.countryId;
    drag = null;
    svg.classList.remove('is-dragging');
    if (!moved && id && ev.type === 'pointerup' && id !== selected) selectCountry(id);
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', () => {
    if (!drag && hovered) hideTooltip();
  });

  svg.addEventListener('focusin', (ev) => {
    const el = ev.target.closest('[data-country-id]');
    const id = el?.dataset.countryId;
    if (!id || selected) return;
    const point = ZIEL_NACH_ID.get(id)?.point || Wt(featureById.get(id));
    const [x, y] = projection(point);
    const box = stage.getBoundingClientRect();
    showTooltip(id, box.left + x, box.top + y);
  });
  svg.addEventListener('focusout', () => hideTooltip());
  svg.addEventListener('keydown', (ev) => {
    const id = ev.target.closest('[data-country-id]')?.dataset.countryId;
    if (id && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      selectCountry(id);
    } else if (ev.key === 'Escape') deselect();
  });

  backBtn.addEventListener('click', deselect);

  dialog.querySelector('.story-dialog__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog) dialog.close();
  });

  root.querySelector('#story-submit').addEventListener('click', (ev) => {
    if (ev.currentTarget.getAttribute('href') !== '#') return;
    ev.preventDefault();
    submitNote.hidden = false;
    submitNote.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'instant' : 'smooth' });
  });

  function introStep() {
    if (introDone || selected || drag?.moved) return;
    const vh = window.innerHeight;
    const raw = klemme((vh - stage.getBoundingClientRect().top) / (vh * 0.85), 0, 1);
    const e = raw * raw * (3 - 2 * raw);
    view.lon = WELT.lon + (1 - e) * INTRO_LON;
    if (raw >= 1) introDone = true;
    schedule();
  }
  window.addEventListener('scroll', introStep, { passive: true });

  /* --- Start ---------------------------------------------------------------- */
  new ResizeObserver(resize).observe(stage);
  resize();
  introStep();
  root.classList.add('is-ready');
  /* Sobald die Bogenkante etwa 30 % ins Bild geschoben ist: erst die vier Länder, dann alle Routen. */
  function einblenden() {
    root.classList.add('is-visible', 'lead-on');
    if (reduce.matches) root.classList.add('all-on');
    else setTimeout(() => root.classList.add('all-on'), 1500);
  }
  const starter = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      starter.disconnect();
      einblenden();
    },
    { rootMargin: '0px 0px -30% 0px' },
  );
  starter.observe(root);
}

export { initStoriesGlobe };
