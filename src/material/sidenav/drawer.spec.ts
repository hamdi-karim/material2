import {
  fakeAsync,
  async,
  tick,
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  flush,
  inject,
} from '@angular/core/testing';
import {Component, ElementRef, ViewChild} from '@angular/core';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatDrawer, MatSidenavModule, MatDrawerContainer} from './index';
import {Direction} from '@angular/cdk/bidi';
import {A11yModule} from '@angular/cdk/a11y';
import {PlatformModule, Platform} from '@angular/cdk/platform';
import {ESCAPE} from '@angular/cdk/keycodes';
import {
  dispatchKeyboardEvent,
  createKeyboardEvent,
  dispatchEvent,
} from '@angular/cdk/testing/private';
import {CdkScrollable} from '@angular/cdk/scrolling';
import {CommonModule} from '@angular/common';


describe('MatDrawer', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatSidenavModule, A11yModule, PlatformModule, NoopAnimationsModule, CommonModule],
      declarations: [
        BasicTestApp,
        DrawerContainerNoDrawerTestApp,
        DrawerSetToOpenedFalse,
        DrawerSetToOpenedTrue,
        DrawerDynamicPosition,
        DrawerWithFocusableElements,
        DrawerOpenBinding,
        DrawerWithoutFocusableElements,
        IndirectDescendantDrawer,
        NestedDrawerContainers,
      ],
    });

    TestBed.compileComponents();
  }));

  describe('methods', () => {
    it('should be able to open', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();

      const testComponent: BasicTestApp = fixture.debugElement.componentInstance;
      const container = fixture.debugElement.query(By.css('mat-drawer-container'))!.nativeElement;

      fixture.debugElement.query(By.css('.open'))!.nativeElement.click();
      fixture.detectChanges();

      expect(testComponent.openCount).toBe(0);
      expect(testComponent.openStartCount).toBe(0);
      expect(container.classList).not.toContain('mat-drawer-container-has-open');

      tick();
      expect(testComponent.openStartCount).toBe(1);
      fixture.detectChanges();

      expect(testComponent.openCount).toBe(1);
      expect(testComponent.openStartCount).toBe(1);
      expect(container.classList).toContain('mat-drawer-container-has-open');
    }));

    it('should be able to close', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();

      const testComponent: BasicTestApp = fixture.debugElement.componentInstance;
      const container = fixture.debugElement.query(By.css('mat-drawer-container'))!.nativeElement;

      fixture.debugElement.query(By.css('.open'))!.nativeElement.click();
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      fixture.debugElement.query(By.css('.close'))!.nativeElement.click();
      fixture.detectChanges();

      expect(testComponent.closeCount).toBe(0);
      expect(testComponent.closeStartCount).toBe(0);
      expect(container.classList).toContain('mat-drawer-container-has-open');

      flush();
      expect(testComponent.closeStartCount).toBe(1);
      fixture.detectChanges();

      expect(testComponent.closeCount).toBe(1);
      expect(testComponent.closeStartCount).toBe(1);
      expect(container.classList).not.toContain('mat-drawer-container-has-open');
    }));

    it('should resolve the open method promise with the new state of the drawer', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();
      const drawer: MatDrawer =
          fixture.debugElement.query(By.directive(MatDrawer))!.componentInstance;

      drawer.open().then(result => expect(result).toBe('open'));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should resolve the close method promise with the new state of the drawer', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();
      const drawer = fixture.debugElement.query(By.directive(MatDrawer))!;
      const drawerInstance: MatDrawer = drawer.componentInstance;

      drawerInstance.open();
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      drawerInstance.close().then(result => expect(result).toBe('close'));
      fixture.detectChanges();
      flush();
      fixture.detectChanges();
    }));

    it('should be able to close while the open animation is running', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();

      const testComponent: BasicTestApp = fixture.debugElement.componentInstance;
      fixture.debugElement.query(By.css('.open'))!.nativeElement.click();
      fixture.detectChanges();

      expect(testComponent.openCount).toBe(0);
      expect(testComponent.closeCount).toBe(0);

      tick();
      fixture.debugElement.query(By.css('.close'))!.nativeElement.click();
      fixture.detectChanges();

      flush();
      fixture.detectChanges();

      expect(testComponent.openCount).toBe(1);
      expect(testComponent.closeCount).toBe(1);
    }));

    it('does not throw when created without a drawer', fakeAsync(() => {
      expect(() => {
        let fixture = TestBed.createComponent(BasicTestApp);
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('should emit the backdropClick event when the backdrop is clicked', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();

      let testComponent: BasicTestApp = fixture.debugElement.componentInstance;
      let openButtonElement = fixture.debugElement.query(By.css('.open'))!.nativeElement;

      openButtonElement.click();
      fixture.detectChanges();
      flush();

      expect(testComponent.backdropClickedCount).toBe(0);

      fixture.debugElement.query(By.css('.mat-drawer-backdrop'))!.nativeElement.click();
      fixture.detectChanges();
      flush();

      expect(testComponent.backdropClickedCount).toBe(1);

      openButtonElement.click();
      fixture.detectChanges();
      flush();

      fixture.debugElement.query(By.css('.close'))!.nativeElement.click();
      fixture.detectChanges();
      flush();

      expect(testComponent.backdropClickedCount).toBe(1);
    }));

    it('should close when pressing escape', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);

      fixture.detectChanges();

      let testComponent: BasicTestApp = fixture.debugElement.componentInstance;
      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!;

      drawer.componentInstance.open();
      fixture.detectChanges();
      tick();

      expect(testComponent.openCount).toBe(1, 'Expected one open event.');
      expect(testComponent.openStartCount).toBe(1, 'Expected one open start event.');
      expect(testComponent.closeCount).toBe(0, 'Expected no close events.');
      expect(testComponent.closeStartCount).toBe(0, 'Expected no close start events.');

      const event = dispatchKeyboardEvent(drawer.nativeElement, 'keydown', ESCAPE);
      fixture.detectChanges();
      flush();

      expect(testComponent.closeCount).toBe(1, 'Expected one close event.');
      expect(testComponent.closeStartCount).toBe(1, 'Expected one close start event.');
      expect(event.defaultPrevented).toBe(true);
    }));

    it('should not close when pressing escape with a modifier', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);

      fixture.detectChanges();

      let testComponent: BasicTestApp = fixture.debugElement.componentInstance;
      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!;

      drawer.componentInstance.open();
      fixture.detectChanges();
      tick();

      expect(testComponent.closeCount).toBe(0, 'Expected no close events.');
      expect(testComponent.closeStartCount).toBe(0, 'Expected no close start events.');

      const event = createKeyboardEvent('keydown', ESCAPE);
      Object.defineProperty(event, 'altKey', {get: () => true});
      dispatchEvent(drawer.nativeElement, event);
      fixture.detectChanges();
      flush();

      expect(testComponent.closeCount).toBe(0, 'Expected still no close events.');
      expect(testComponent.closeStartCount).toBe(0, 'Expected still no close start events.');
      expect(event.defaultPrevented).toBe(false);
    }));

    it('should fire the open event when open on init', fakeAsync(() => {
      let fixture = TestBed.createComponent(DrawerSetToOpenedTrue);

      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.openCallback).toHaveBeenCalledTimes(1);
    }));

    it('should not close by pressing escape when disableClose is set', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);
      let testComponent = fixture.debugElement.componentInstance;
      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!;

      drawer.componentInstance.disableClose = true;
      drawer.componentInstance.open();
      fixture.detectChanges();
      tick();

      dispatchKeyboardEvent(drawer.nativeElement, 'keydown', ESCAPE);
      fixture.detectChanges();
      tick();

      expect(testComponent.closeCount).toBe(0);
      expect(testComponent.closeStartCount).toBe(0);
    }));

    it('should not close by clicking on the backdrop when disableClose is set', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);
      let testComponent = fixture.debugElement.componentInstance;
      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!.componentInstance;

      drawer.disableClose = true;
      drawer.open();
      fixture.detectChanges();
      tick();

      fixture.debugElement.query(By.css('.mat-drawer-backdrop'))!.nativeElement.click();
      fixture.detectChanges();
      tick();

      expect(testComponent.closeCount).toBe(0);
      expect(testComponent.closeStartCount).toBe(0);
    }));

    it('should restore focus on close if focus is inside drawer', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);

      fixture.detectChanges();

      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!.componentInstance;
      let openButton = fixture.componentInstance.openButton.nativeElement;
      let drawerButton = fixture.componentInstance.drawerButton.nativeElement;

      openButton.focus();
      drawer.open();
      fixture.detectChanges();
      flush();
      drawerButton.focus();

      drawer.close();
      fixture.detectChanges();
      flush();

      expect(document.activeElement)
          .toBe(openButton, 'Expected focus to be restored to the open button on close.');
    }));

    it('should not restore focus on close if focus is outside drawer', fakeAsync(() => {
      let fixture = TestBed.createComponent(BasicTestApp);
      let drawer: MatDrawer = fixture.debugElement
          .query(By.directive(MatDrawer))!.componentInstance;
      fixture.detectChanges();

      let openButton = fixture.componentInstance.openButton.nativeElement;
      let closeButton = fixture.componentInstance.closeButton.nativeElement;

      openButton.focus();
      drawer.open();

      fixture.detectChanges();
      tick();
      closeButton.focus();

      drawer.close();
      fixture.detectChanges();
      tick();

      expect(document.activeElement)
          .toBe(closeButton, 'Expected focus not to be restored to the open button on close.');
    }));

    it('should pick up drawers that are not direct descendants', fakeAsync(() => {
      const fixture = TestBed.createComponent(IndirectDescendantDrawer);
      fixture.detectChanges();

      expect(fixture.componentInstance.drawer.opened).toBe(false);

      fixture.componentInstance.container.open();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(fixture.componentInstance.drawer.opened).toBe(true);
    }));

    it('should not pick up drawers from nested containers', fakeAsync(() => {
      const fixture = TestBed.createComponent(NestedDrawerContainers);
      const instance = fixture.componentInstance;
      fixture.detectChanges();

      expect(instance.outerDrawer.opened).toBe(false);
      expect(instance.innerDrawer.opened).toBe(false);

      instance.outerContainer.open();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(instance.outerDrawer.opened).toBe(true);
      expect(instance.innerDrawer.opened).toBe(false);

      instance.innerContainer.open();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(instance.outerDrawer.opened).toBe(true);
      expect(instance.innerDrawer.opened).toBe(true);
    }));

  });

  describe('attributes', () => {
    it('should correctly parse opened="false"', () => {
      let fixture = TestBed.createComponent(DrawerSetToOpenedFalse);

      fixture.detectChanges();

      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!.componentInstance;

      expect((drawer as MatDrawer).opened).toBe(false);
    });

    it('should correctly parse opened="true"', () => {
      let fixture = TestBed.createComponent(DrawerSetToOpenedTrue);

      fixture.detectChanges();

      let drawer = fixture.debugElement.query(By.directive(MatDrawer))!.componentInstance;

      expect((drawer as MatDrawer).opened).toBe(true);
    });

    it('should remove align attr from DOM', () => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();

      const drawerEl = fixture.debugElement.query(By.css('mat-drawer'))!.nativeElement;
      expect(drawerEl.hasAttribute('align'))
          .toBe(false, 'Expected drawer not to have a native align attribute.');
    });

    it('should throw when multiple drawers have the same position', fakeAsync(() => {
      const fixture = TestBed.createComponent(DrawerDynamicPosition);
      fixture.detectChanges();
      tick();

      const testComponent: DrawerDynamicPosition = fixture.debugElement.componentInstance;
      testComponent.drawer1Position = 'end';

      expect(() => {
        try {
          fixture.detectChanges();
          tick(0);
        } catch {
          tick(0);
        }
      }).toThrow();
    }));

    it('should not throw when drawers swap positions', () => {
      const fixture = TestBed.createComponent(DrawerDynamicPosition);
      fixture.detectChanges();

      const testComponent: DrawerDynamicPosition = fixture.debugElement.componentInstance;
      testComponent.drawer1Position = 'end';
      testComponent.drawer2Position = 'start';

      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should bind 2-way bind on opened property', fakeAsync(() => {
      const fixture = TestBed.createComponent(DrawerOpenBinding);
      fixture.detectChanges();

      let drawer: MatDrawer = fixture.debugElement
          .query(By.directive(MatDrawer))!.componentInstance;

      drawer.open();
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.isOpen).toBe(true);
    }));

    it('should not throw when a two-way binding is toggled quickly while animating',
      fakeAsync(() => {
        TestBed
          .resetTestingModule()
          .configureTestingModule({
            imports: [MatSidenavModule, BrowserAnimationsModule],
            declarations: [DrawerOpenBinding],
          })
          .compileComponents();

        const fixture = TestBed.createComponent(DrawerOpenBinding);
        fixture.detectChanges();

        // Note that we need actual timeouts and the `BrowserAnimationsModule`
        // in order to test it correctly.
        setTimeout(() => {
          fixture.componentInstance.isOpen = !fixture.componentInstance.isOpen;
          expect(() => fixture.detectChanges()).not.toThrow();

          setTimeout(() => {
            fixture.componentInstance.isOpen = !fixture.componentInstance.isOpen;
            expect(() => fixture.detectChanges()).not.toThrow();
          }, 1);

          tick(1);
        }, 1);

        tick(1);
      }));

  });

  describe('focus trapping behavior', () => {
    let fixture: ComponentFixture<DrawerWithFocusableElements>;
    let testComponent: DrawerWithFocusableElements;
    let drawer: MatDrawer;
    let firstFocusableElement: HTMLElement;
    let lastFocusableElement: HTMLElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(DrawerWithFocusableElements);
      fixture.detectChanges();
      testComponent = fixture.debugElement.componentInstance;
      drawer = fixture.debugElement.query(By.directive(MatDrawer))!.componentInstance;
      firstFocusableElement = fixture.debugElement.query(By.css('.input1'))!.nativeElement;
      lastFocusableElement = fixture.debugElement.query(By.css('.input2'))!.nativeElement;
      lastFocusableElement.focus();
    });

    it('should trap focus when opened in "over" mode', fakeAsync(() => {
      testComponent.mode = 'over';
      fixture.detectChanges();
      lastFocusableElement.focus();

      drawer.open();
      fixture.detectChanges();
      tick();

      expect(document.activeElement).toBe(firstFocusableElement);
    }));

    it('should trap focus when opened in "push" mode', fakeAsync(() => {
      testComponent.mode = 'push';
      fixture.detectChanges();
      lastFocusableElement.focus();

      drawer.open();
      fixture.detectChanges();
      tick();

      expect(document.activeElement).toBe(firstFocusableElement);
    }));

    it('should not auto-focus by default when opened in "side" mode', fakeAsync(() => {
      testComponent.mode = 'side';
      fixture.detectChanges();
      lastFocusableElement.focus();

      drawer.open();
      fixture.detectChanges();
      tick();

      expect(document.activeElement).toBe(lastFocusableElement);
    }));

    it('should auto-focus when opened in "side" mode when enabled explicitly', fakeAsync(() => {
      drawer.autoFocus = true;
      testComponent.mode = 'side';
      fixture.detectChanges();
      lastFocusableElement.focus();

      drawer.open();
      fixture.detectChanges();
      tick();

      expect(document.activeElement).toBe(firstFocusableElement);
    }));

    it('should focus the drawer if there are no focusable elements', fakeAsync(() => {
      fixture.destroy();

      const nonFocusableFixture = TestBed.createComponent(DrawerWithoutFocusableElements);
      const drawerEl = nonFocusableFixture.debugElement.query(By.directive(MatDrawer))!;
      nonFocusableFixture.detectChanges();

      drawerEl.componentInstance.open();
      nonFocusableFixture.detectChanges();
      tick();

      expect(document.activeElement).toBe(drawerEl.nativeElement);
    }));

    it('should be able to disable auto focus', fakeAsync(() => {
      drawer.autoFocus = false;
      testComponent.mode = 'push';
      fixture.detectChanges();
      lastFocusableElement.focus();

      drawer.open();
      fixture.detectChanges();
      tick();

      expect(document.activeElement).not.toBe(firstFocusableElement);
    }));

    it('should update the focus trap enable state if the mode changes while open', fakeAsync(() => {
      testComponent.mode = 'side';
      fixture.detectChanges();

      drawer.open();
      fixture.detectChanges();
      tick();

      const anchors =
          Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.cdk-focus-trap-anchor'));

      expect(anchors.every(anchor => !anchor.hasAttribute('tabindex')))
          .toBe(true, 'Expected focus trap anchors to be disabled in side mode.');

      testComponent.mode = 'over';
      fixture.detectChanges();

      expect(anchors.every(anchor => anchor.getAttribute('tabindex') === '0'))
          .toBe(true, 'Expected focus trap anchors to be enabled in over mode.');
    }));

  });

  describe('DOM position', () => {
    it('should project start drawer before the content', () => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.componentInstance.position = 'start';
      fixture.detectChanges();

      const allNodes = getDrawerNodesArray(fixture);
      const drawerIndex = allNodes.indexOf(fixture.nativeElement.querySelector('.mat-drawer'));
      const contentIndex =
          allNodes.indexOf(fixture.nativeElement.querySelector('.mat-drawer-content'));

      expect(drawerIndex).toBeGreaterThan(-1, 'Expected drawer to be inside the container');
      expect(contentIndex).toBeGreaterThan(-1, 'Expected content to be inside the container');
      expect(drawerIndex).toBeLessThan(contentIndex, 'Expected drawer to be before the content');
    });

    it('should project end drawer after the content', () => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.componentInstance.position = 'end';
      fixture.detectChanges();

      const allNodes = getDrawerNodesArray(fixture);
      const drawerIndex = allNodes.indexOf(fixture.nativeElement.querySelector('.mat-drawer'));
      const contentIndex =
          allNodes.indexOf(fixture.nativeElement.querySelector('.mat-drawer-content'));

      expect(drawerIndex).toBeGreaterThan(-1, 'Expected drawer to be inside the container');
      expect(contentIndex).toBeGreaterThan(-1, 'Expected content to be inside the container');
      expect(drawerIndex).toBeGreaterThan(contentIndex, 'Expected drawer to be after the content');
    });

    it('should move the drawer before/after the content when its position changes after being ' +
      'initialized at `start`', () => {
        const fixture = TestBed.createComponent(BasicTestApp);
        fixture.componentInstance.position = 'start';
        fixture.detectChanges();

        const drawer = fixture.nativeElement.querySelector('.mat-drawer');
        const content = fixture.nativeElement.querySelector('.mat-drawer-content');

        let allNodes = getDrawerNodesArray(fixture);
        const startDrawerIndex = allNodes.indexOf(drawer);
        const startContentIndex = allNodes.indexOf(content);

        expect(startDrawerIndex).toBeGreaterThan(-1, 'Expected drawer to be inside the container');
        expect(startContentIndex)
            .toBeGreaterThan(-1, 'Expected content to be inside the container');
        expect(startDrawerIndex)
            .toBeLessThan(startContentIndex, 'Expected drawer to be before the content on init');

        fixture.componentInstance.position = 'end';
        fixture.detectChanges();
        allNodes = getDrawerNodesArray(fixture);

        expect(allNodes.indexOf(drawer)).toBeGreaterThan(allNodes.indexOf(content),
            'Expected drawer to be after content when position changes to `end`');

        fixture.componentInstance.position = 'start';
        fixture.detectChanges();
        allNodes = getDrawerNodesArray(fixture);

        expect(allNodes.indexOf(drawer)).toBeLessThan(allNodes.indexOf(content),
            'Expected drawer to be before content when position changes back to `start`');
      });

    it('should move the drawer before/after the content when its position changes after being ' +
      'initialized at `end`', () => {
        const fixture = TestBed.createComponent(BasicTestApp);
        fixture.componentInstance.position = 'end';
        fixture.detectChanges();

        const drawer = fixture.nativeElement.querySelector('.mat-drawer');
        const content = fixture.nativeElement.querySelector('.mat-drawer-content');

        let allNodes = getDrawerNodesArray(fixture);
        const startDrawerIndex = allNodes.indexOf(drawer);
        const startContentIndex = allNodes.indexOf(content);

        expect(startDrawerIndex).toBeGreaterThan(-1, 'Expected drawer to be inside the container');
        expect(startContentIndex)
            .toBeGreaterThan(-1, 'Expected content to be inside the container');
        expect(startDrawerIndex)
            .toBeGreaterThan(startContentIndex, 'Expected drawer to be after the content on init');

        fixture.componentInstance.position = 'start';
        fixture.detectChanges();
        allNodes = getDrawerNodesArray(fixture);

        expect(allNodes.indexOf(drawer)).toBeLessThan(allNodes.indexOf(content),
            'Expected drawer to be before content when position changes to `start`');

        fixture.componentInstance.position = 'end';
        fixture.detectChanges();
        allNodes = getDrawerNodesArray(fixture);

        expect(allNodes.indexOf(drawer)).toBeGreaterThan(allNodes.indexOf(content),
            'Expected drawer to be after content when position changes back to `end`');
      });

    function getDrawerNodesArray(fixture: ComponentFixture<any>): HTMLElement[] {
      return Array.from(fixture.nativeElement.querySelector('.mat-drawer-container').childNodes);
    }

  });
});

describe('MatDrawerContainer', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MatSidenavModule, A11yModule, PlatformModule, NoopAnimationsModule],
      declarations: [
        DrawerContainerTwoDrawerTestApp,
        DrawerDelayed,
        DrawerSetToOpenedTrue,
        DrawerContainerStateChangesTestApp,
        AutosizeDrawer,
        BasicTestApp,
        DrawerContainerWithContent,
      ],
    });

    TestBed.compileComponents();
  }));

  it('should be able to open and close all drawers', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerContainerTwoDrawerTestApp);

    fixture.detectChanges();

    const testComponent: DrawerContainerTwoDrawerTestApp =
      fixture.debugElement.componentInstance;
    const drawers = fixture.debugElement.queryAll(By.directive(MatDrawer));

    expect(drawers.every(drawer => drawer.componentInstance.opened)).toBe(false);

    testComponent.drawerContainer.open();
    fixture.detectChanges();
    tick();

    expect(drawers.every(drawer => drawer.componentInstance.opened)).toBe(true);

    testComponent.drawerContainer.close();
    fixture.detectChanges();
    flush();

    expect(drawers.every(drawer => drawer.componentInstance.opened)).toBe(false);
  }));

  it('should animate the content when a drawer is added at a later point', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerDelayed);

    fixture.detectChanges();

    const contentElement = fixture.debugElement.nativeElement.querySelector('.mat-drawer-content');

    expect(parseInt(contentElement.style.marginLeft)).toBeFalsy();

    fixture.componentInstance.showDrawer = true;
    fixture.detectChanges();

    fixture.componentInstance.drawer.open();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(parseInt(contentElement.style.marginLeft)).toBeGreaterThan(0);
  }));

  it('should recalculate the margin if a drawer is destroyed', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerContainerStateChangesTestApp);

    fixture.detectChanges();
    fixture.componentInstance.drawer.open();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const contentElement = fixture.debugElement.nativeElement.querySelector('.mat-drawer-content');
    const initialMargin = parseInt(contentElement.style.marginLeft);

    expect(initialMargin).toBeGreaterThan(0);

    fixture.componentInstance.renderDrawer = false;
    fixture.detectChanges();
    tick();

    expect(contentElement.style.marginLeft).toBe('');
  }));

  it('should recalculate the margin if the drawer mode is changed', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerContainerStateChangesTestApp);

    fixture.detectChanges();
    fixture.componentInstance.drawer.open();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const contentElement = fixture.debugElement.nativeElement.querySelector('.mat-drawer-content');
    const initialMargin = parseInt(contentElement.style.marginLeft);

    expect(initialMargin).toBeGreaterThan(0);

    fixture.componentInstance.mode = 'over';
    fixture.detectChanges();

    expect(contentElement.style.marginLeft).toBe('');
  }));

  it('should recalculate the margin if the direction has changed', fakeAsync(() => {
    const fixture = TestBed.createComponent(DrawerContainerStateChangesTestApp);

    fixture.detectChanges();
    fixture.componentInstance.drawer.open();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const contentElement = fixture.debugElement.nativeElement.querySelector('.mat-drawer-content');
    const margin = parseInt(contentElement.style.marginLeft);

    expect(margin).toBeGreaterThan(0);

    fixture.componentInstance.direction = 'rtl';
    fixture.detectChanges();

    expect(contentElement.style.marginLeft).toBe('');
    expect(parseInt(contentElement.style.marginRight)).toBe(margin);
  }));

  it('should not animate when the sidenav is open on load', fakeAsync(() => {
    TestBed
      .resetTestingModule()
      .configureTestingModule({
        imports: [MatSidenavModule, BrowserAnimationsModule],
        declarations: [DrawerSetToOpenedTrue],
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DrawerSetToOpenedTrue);

    fixture.detectChanges();
    tick();

    const container = fixture.debugElement.nativeElement.querySelector('.mat-drawer-container');

    expect(container.classList).not.toContain('mat-drawer-transition');
  }));

  it('should recalculate the margin if a drawer changes size while open in autosize mode',
    fakeAsync(inject([Platform], (platform: Platform) => {
      const fixture = TestBed.createComponent(AutosizeDrawer);

      fixture.detectChanges();
      fixture.componentInstance.drawer.open();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // IE and Edge are flaky in when they update the styles.
      // For them we fall back to checking whether the proper method was called.
      const isFlaky = platform.EDGE || platform.TRIDENT;
      const contentEl = fixture.debugElement.nativeElement.querySelector('.mat-drawer-content');
      const initialMargin = parseInt(contentEl.style.marginLeft);

      if (isFlaky) {
        spyOn(fixture.componentInstance.drawerContainer, 'updateContentMargins');
      } else {
        expect(initialMargin).toBeGreaterThan(0);
      }

      fixture.componentInstance.fillerWidth = 200;
      fixture.detectChanges();
      tick(10);
      fixture.detectChanges();

      if (isFlaky) {
        expect(fixture.componentInstance.drawerContainer.updateContentMargins).toHaveBeenCalled();
      } else {
        expect(parseInt(contentEl.style.marginLeft)).toBeGreaterThan(initialMargin);
      }

      discardPeriodicTasks();
    })));

  it('should not set a style property if it would be zero', fakeAsync(() => {
      const fixture = TestBed.createComponent(AutosizeDrawer);
      fixture.detectChanges();

      const content = fixture.debugElement.nativeElement.querySelector('.mat-drawer-content');
      expect(content.style.marginLeft).toBe('', 'Margin should be omitted when drawer is closed');

      // Open the drawer and resolve the open animation.
      fixture.componentInstance.drawer.open();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(content.style.marginLeft).not.toBe('', 'Margin should be present when drawer is open');

      // Close the drawer and resolve the close animation.
      fixture.componentInstance.drawer.close();
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(content.style.marginLeft).toBe('', 'Margin should be removed after drawer close.');

      discardPeriodicTasks();
    }));

    it('should be able to toggle whether the container has a backdrop', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.mat-drawer-backdrop')).toBeTruthy();

      fixture.componentInstance.hasBackdrop = false;
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.mat-drawer-backdrop')).toBeFalsy();
    }));

    it('should be able to explicitly enable the backdrop in `side` mode', fakeAsync(() => {
      const fixture = TestBed.createComponent(BasicTestApp);
      const root = fixture.nativeElement;
      fixture.detectChanges();

      fixture.componentInstance.drawer.mode = 'side';
      fixture.detectChanges();
      fixture.componentInstance.drawer.open();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      let backdrop = root.querySelector('.mat-drawer-backdrop.mat-drawer-shown');

      expect(backdrop).toBeFalsy();

      fixture.componentInstance.hasBackdrop = true;
      fixture.detectChanges();
      backdrop = root.querySelector('.mat-drawer-backdrop.mat-drawer-shown');

      expect(backdrop).toBeTruthy();
      expect(fixture.componentInstance.drawer.opened).toBe(true);

      backdrop.click();
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.drawer.opened).toBe(false);
    }));

    it('should expose a scrollable when the consumer has not specified drawer content',
      fakeAsync(() => {
        const fixture = TestBed.createComponent(DrawerContainerTwoDrawerTestApp);

        fixture.detectChanges();

        expect(fixture.componentInstance.drawerContainer.scrollable instanceof CdkScrollable)
            .toBe(true);
      }));

    it('should expose a scrollable when the consumer has specified drawer content',
      fakeAsync(() => {
        const fixture = TestBed.createComponent(DrawerContainerWithContent);

        fixture.detectChanges();

        expect(fixture.componentInstance.drawerContainer.scrollable instanceof CdkScrollable)
            .toBe(true);
      }));

    it('should clean up the drawers stream on destroy', fakeAsync(() => {
      const fixture = TestBed.createComponent(DrawerContainerTwoDrawerTestApp);
      fixture.detectChanges();

      const spy = jasmine.createSpy('complete spy');
      const subscription = fixture.componentInstance.drawerContainer._drawers.changes.subscribe({
        complete: spy
      });

      fixture.destroy();

      expect(spy).toHaveBeenCalled();
      subscription.unsubscribe();
    }));

    it('should position the drawers before/after the content in the DOM based on their position',
      fakeAsync(() => {
        const fixture = TestBed.createComponent(DrawerContainerTwoDrawerTestApp);
        fixture.detectChanges();

        const drawerDebugElements = fixture.debugElement.queryAll(By.directive(MatDrawer));
        const [start, end] = drawerDebugElements.map(el => el.componentInstance);
        const [startNode, endNode] = drawerDebugElements.map(el => el.nativeElement);
        const contentNode = fixture.nativeElement.querySelector('.mat-drawer-content');
        const allNodes: HTMLElement[] =
            Array.from(fixture.nativeElement.querySelector('.mat-drawer-container').childNodes);
        const startIndex = allNodes.indexOf(startNode);
        const endIndex = allNodes.indexOf(endNode);
        const contentIndex = allNodes.indexOf(contentNode);

        expect(start.position).toBe('start');
        expect(end.position).toBe('end');
        expect(contentIndex).toBeGreaterThan(-1, 'Expected content to be inside the container');
        expect(startIndex).toBeGreaterThan(-1, 'Expected start drawer to be inside the container');
        expect(endIndex).toBeGreaterThan(-1, 'Expected end drawer to be inside the container');

        expect(startIndex).toBeLessThan(contentIndex, 'Expected start drawer to be before content');
        expect(endIndex).toBeGreaterThan(contentIndex, 'Expected end drawer to be after content');
      }));

});


/** Test component that contains an MatDrawerContainer but no MatDrawer. */
@Component({template: `<mat-drawer-container></mat-drawer-container>`})
class DrawerContainerNoDrawerTestApp { }

/** Test component that contains an MatDrawerContainer and 2 MatDrawer in the same position. */
@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer position="start"></mat-drawer>
      <mat-drawer position="end"></mat-drawer>
    </mat-drawer-container>`,
})
class DrawerContainerTwoDrawerTestApp {
  @ViewChild(MatDrawerContainer) drawerContainer: MatDrawerContainer;
}

/** Test component that contains an MatDrawerContainer and one MatDrawer. */
@Component({
  template: `
    <mat-drawer-container (backdropClick)="backdropClicked()" [hasBackdrop]="hasBackdrop">
      <mat-drawer #drawer="matDrawer" [position]="position"
                 (opened)="open()"
                 (openedStart)="openStart()"
                 (closed)="close()"
                 (closedStart)="closeStart()">
        <button #drawerButton>Content</button>
      </mat-drawer>
      <button (click)="drawer.open()" class="open" #openButton></button>
      <button (click)="drawer.close()" class="close" #closeButton></button>
    </mat-drawer-container>`,
})
class BasicTestApp {
  openCount = 0;
  openStartCount = 0;
  closeCount = 0;
  closeStartCount = 0;
  backdropClickedCount = 0;
  hasBackdrop: boolean | null = null;
  position = 'start';

  @ViewChild('drawer') drawer: MatDrawer;
  @ViewChild('drawerButton') drawerButton: ElementRef<HTMLButtonElement>;
  @ViewChild('openButton') openButton: ElementRef<HTMLButtonElement>;
  @ViewChild('closeButton') closeButton: ElementRef<HTMLButtonElement>;

  open() {
    this.openCount++;
  }

  openStart() {
    this.openStartCount++;
  }

  close() {
    this.closeCount++;
  }

  closeStart() {
    this.closeStartCount++;
  }

  backdropClicked() {
    this.backdropClickedCount++;
  }
}

@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer mode="side" opened="false">
        Closed Drawer.
      </mat-drawer>
    </mat-drawer-container>`,
})
class DrawerSetToOpenedFalse { }

@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer mode="side" opened="true" (opened)="openCallback()">
        Closed Drawer.
      </mat-drawer>
    </mat-drawer-container>`,
})
class DrawerSetToOpenedTrue {
  openCallback = jasmine.createSpy('open callback');
}

@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer mode="side" [(opened)]="isOpen">
        Closed Drawer.
      </mat-drawer>
    </mat-drawer-container>`,
})
class DrawerOpenBinding {
  isOpen = false;
}

@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer #drawer1 [position]="drawer1Position"></mat-drawer>
      <mat-drawer #drawer2 [position]="drawer2Position"></mat-drawer>
    </mat-drawer-container>`,
})
class DrawerDynamicPosition {
  drawer1Position = 'start';
  drawer2Position = 'end';
}

@Component({
  // Note: we use inputs here, because they're guaranteed
  // to be focusable across all platforms.
  template: `
    <mat-drawer-container>
      <mat-drawer position="start" [mode]="mode">
        <input type="text" class="input1"/>
      </mat-drawer>
      <input type="text" class="input2"/>
    </mat-drawer-container>`,
})
class DrawerWithFocusableElements {
  mode: string = 'over';
}

@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer position="start" mode="over">
        <button disabled>Not focusable</button>
      </mat-drawer>
    </mat-drawer-container>`,
})
class DrawerWithoutFocusableElements {}

@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer *ngIf="showDrawer" #drawer mode="side">Drawer</mat-drawer>
    </mat-drawer-container>
  `,
})
class DrawerDelayed {
  @ViewChild(MatDrawer) drawer: MatDrawer;
  showDrawer = false;
}


@Component({
  template: `
    <mat-drawer-container [dir]="direction">
      <mat-drawer *ngIf="renderDrawer" [mode]="mode" style="width:100px"></mat-drawer>
    </mat-drawer-container>`,
})
class DrawerContainerStateChangesTestApp {
  @ViewChild(MatDrawer) drawer: MatDrawer;
  @ViewChild(MatDrawerContainer) drawerContainer: MatDrawerContainer;

  direction: Direction = 'ltr';
  mode = 'side';
  renderDrawer = true;
}


@Component({
  template: `
    <mat-drawer-container autosize style="min-height: 200px;">
      <mat-drawer mode="push" [position]="drawer1Position">
        Text
        <div [style.width.px]="fillerWidth" style="height: 200px; background: red;"></div>
      </mat-drawer>
    </mat-drawer-container>`,
})
class AutosizeDrawer {
  @ViewChild(MatDrawer) drawer: MatDrawer;
  @ViewChild(MatDrawerContainer) drawerContainer: MatDrawerContainer;
  fillerWidth = 0;
}


@Component({
  template: `
    <mat-drawer-container>
      <mat-drawer>Drawer</mat-drawer>
      <mat-drawer-content>Content</mat-drawer-content>
    </mat-drawer-container>
  `,
})
class DrawerContainerWithContent {
  @ViewChild(MatDrawerContainer) drawerContainer: MatDrawerContainer;
}


@Component({
  // Note that we need the `ng-container` with the `ngSwitch` so that
  // there's a directive between the container and the drawer.
  template: `
    <mat-drawer-container #container>
      <ng-container [ngSwitch]="true">
        <mat-drawer #drawer>Drawer</mat-drawer>
      </ng-container>
    </mat-drawer-container>`,
})
class IndirectDescendantDrawer {
  @ViewChild('container') container: MatDrawerContainer;
  @ViewChild('drawer') drawer: MatDrawer;
}

@Component({
  template: `
    <mat-drawer-container #outerContainer>
      <mat-drawer #outerDrawer>Drawer</mat-drawer>
      <mat-drawer-content>
        <mat-drawer-container #innerContainer>
          <mat-drawer #innerDrawer>Drawer</mat-drawer>
        </mat-drawer-container>
      </mat-drawer-content>
    </mat-drawer-container>
  `,
})
class NestedDrawerContainers {
  @ViewChild('outerContainer') outerContainer: MatDrawerContainer;
  @ViewChild('outerDrawer') outerDrawer: MatDrawer;
  @ViewChild('innerContainer') innerContainer: MatDrawerContainer;
  @ViewChild('innerDrawer') innerDrawer: MatDrawer;
}
