import View from './view'
import Swiper from '../lib/swiper'
import SharedTransition from '../lib/shared-transition'
// 다 가져오는 게 맞는 것일까
import icons from '../helper/icons'
import {
  repeat,
  addClass,
  removeClass,
  hasClass,
  addStyle,
  emptyStyle,
  debounce,
  prettyTime
} from '../helper/utils'
import {
  tmdb
} from '../services/api'

const template = `
  <div class="nc-tracks" ref="tracks">
    ${(() => {
      const tracks = [
        { key: 'trending',title: '지금 뜨는 콘텐츠' },
        { key: 'animation', title: '애니메이션' },
        { key: 'romance', title: '로맨스' },
        { key: 'comedy', title: '코메디' }
      ]

      return tracks.map(track => {
        return `
          <div class="nc-track">
            <h2 class="nc-title">${track.title}</h2>
            <div class="nc-inner">
              <div class="nc-swiper-container">
                <div class="nc-swiper-prev"></div>
                <div class="nc-swiper-wrapper" ref="${track.key}">
                  ${repeat('<div class="nc-swiper-slide"><a href="/"><div class="thumbnail"></div><div class="metadata">&nbsp;</div></a></div>', 12)}
                </div>
                <div class="nc-swiper-next"></div>
              </div>
            </div>
          </div>
        `
      }).join('')
    })()}
  </div>
  <div class="nc-preview">
    <div class="nc-preview-inner" ref="preview">
      <div class="nc-preview-thumbnail">
        <img src="" ref="previewSmall">
        <img src="" ref="previewLarge">
      </div>
      <div class="nc-preview-metadata" ref="previewMetadata"></div>
      <div class="nc-preview-close">
        <button type="button" ref="previewClose"><svg viewBox="0 0 24 24" data-uia="previewModal-closebtn" role="button" aria-label="close" tabindex="0"><path d="M12 10.586l7.293-7.293 1.414 1.414L13.414 12l7.293 7.293-1.414 1.414L12 13.414l-7.293 7.293-1.414-1.414L10.586 12 3.293 4.707l1.414-1.414L12 10.586z" fill="currentColor"></path></svg></button>
      </div>
    </div>
  </div>
`

class Home extends View {
  constructor (router) {
    super({
      innerHTML: template,
      className: 'nc-home'
    })

    this._router = router
    this._swiperGroup = []
    this._previewTimer = 0
  }

  mounted () {
    // 0: {id: 28, name: "액션"}
    // 1: {id: 12, name: "모험"}
    // 2: {id: 16, name: "애니메이션"}
    // 3: {id: 35, name: "코미디"}
    // 4: {id: 80, name: "범죄"}
    // 5: {id: 99, name: "다큐멘터리"}
    // 6: {id: 18, name: "드라마"}
    // 7: {id: 10751, name: "가족"}
    // 8: {id: 14, name: "판타지"}
    // 9: {id: 36, name: "역사"}
    // 10: {id: 27, name: "공포"}
    // 11: {id: 10402, name: "음악"}
    // 12: {id: 9648, name: "미스터리"}
    // 13: {id: 10749, name: "로맨스"}
    // 14: {id: 878, name: "SF"}
    // 15: {id: 10770, name: "TV 영화"}
    // 16: {id: 53, name: "스릴러"}
    // 17: {id: 10752, name: "전쟁"}
    // 18: {id: 37, name: "서부"}

    // 지금 뜨는 콘텐츠
    this._renderSwipeTrending()
    // 애니메이션
    this._renderSwipeAnimation()
    // 로맨스
    this._renderSwipeRomance()
    // 코메디
    this._renderSwipeComedy()
  }

  destroyed () {
    this._swiperGroup.forEach(swiper => swiper.destroy())
    this._swiperGroup = null
  }

  _renderSwipeTrending () {
    const trending = this.DOM.trending
    this.intersectionObserver(trending, () => {
      tmdb.getTrending()
        .then(({ results }) => this._renderSwipe(trending, results))
    })
  }  

  _renderSwipeAnimation () {
    const animation = this.DOM.animation
    this.intersectionObserver(animation, () => {
      tmdb.getPopularGenre(16)
        .then(({ results }) => this._renderSwipe(animation, results))
    })
  }

  _renderSwipeRomance () {
    const romance = this.DOM.romance
    this.intersectionObserver(romance, () => {
      tmdb.getPopularGenre(10749)
        .then(({ results }) => this._renderSwipe(romance, results))
    })
  }

  _renderSwipeComedy () {
    const comedy = this.DOM.comedy
    this.intersectionObserver(comedy, () => {
      tmdb.getPopularGenre(35)
        .then(({ results }) => this._renderSwipe(comedy, results))
    })
  }

  _renderSwipe (elem, results) {
    return new Promise((resolve, reject) => {
      while (elem.hasChildNodes()) {
        elem.removeChild(elem.lastChild)
      }
  
      const length = results.length
      for (let i = 0; i < length; i++) {
        const data = results[i]
        const isLast = i === length - 1
        requestAnimationFrame(() => {
          elem.insertAdjacentHTML('beforeend', `
            <div class="nc-swiper-slide" data-id="${data.id}">
              <a href="/">
                <div class="thumbnail">
                  <img data-src="${tmdb.IMG_URL + data.backdrop_path}">
                </div>
                <div class="metadata">${data.title}</div>
              </a>
            </div>
          `)
  
          if (isLast) {
            this._setupSwipe(elem)
              .then(() => resolve())
          }
        })
      }
    })
  }

  _setupSwipe (elem) {
    return new Promise((resolve, reject) => {
      const images = Array.from(elem.querySelectorAll('[data-src]'))
      this.lazyLoad(images, { threshold: 0.1 })

      this._swiperGroup.push(
        new Swiper(elem, {
          navigation: {
            prevEl: elem.parentNode.querySelector('.nc-swiper-prev'),
            nextEl: elem.parentNode.querySelector('.nc-swiper-next')
          }
        })
      )

      let hoverTimeout = 0
      const mouseenterFn = (event) => {
        hoverTimeout = setTimeout(() => {
          this._showMiniPreview(event)
        }, 400)
      }
      const mouseleaveFn = () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
        }
      }

      images.forEach(image => {
        image.addEventListener('mouseenter', mouseenterFn)
        image.addEventListener('mouseleave', mouseleaveFn)
      })

      resolve()
    })
  }

  _setMiniPreviewPos (event) {
    const root = document.documentElement
    const fromEl = event.target
    const toEl = this.DOM.preview
    const metaEl = this.DOM.previewMetadata
    const bounds = this._getRect(fromEl)
    const winW = window.innerWidth
    const width = bounds.width * 1.5
    let height = bounds.height * 1.5
    height = height + metaEl.clientHeight

    let top = bounds.top - (height - bounds.height) / 2
    top = top + root.scrollTop

    let left = bounds.left - (width - bounds.width) / 2
    if (left <= 0) {
      left = bounds.left
    } else if ((left + width) >= winW) {
      left = bounds.right - width
    }

    addStyle(toEl, {
      position: 'absolute',
      left: 0,
      top: 0,
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${left}px, ${top}px)`
    })
  }

  _setMiniPreviewMeta (details) {
    const average = details.vote_average * 10
    const runtime = details.runtime
    const releaseDate = details.release_date.replace(/-/g, '. ')
    const genres = details.genres.slice(0, 3)

    this.DOM.previewMetadata.insertAdjacentHTML('beforeend', `
      <div class="nc-preview-buttons">
        <div class="left">
          <button class="play" type="button">${icons.play}</button>
          <button class="add" type="button">${icons.add}</button>
          <button class="like" type="button">${icons.like}</button>
          <button class="unlike" type="button">${icons.unlike}</button>
        </div>
        <div class="right">
          <button class="details" type="button">${icons.arrow_down}</button>
        </div>
      </div>
      <div class="nc-preview-info">
        <span class="average">${average}% 일치</span>
        <span class="runtime">${runtime}분</span>
        <span class="date">${releaseDate}</span>
      </div>
      <div class="nc-preview-genres">
        ${(() => {
          return genres.map(tag => {
            return `<span>${tag.name}</span>`
          }).join('')
        })()}
      </div>
    `)
  }

  async _showMiniPreview (event) {
    const fromEl = event.target
    const toEl = this.DOM.preview
    const id = fromEl.closest('[data-id]').dataset.id
    const details = await tmdb.getMovieDetails(id)

    // 메타데이타 정보 설정
    this._setMiniPreviewMeta(details)
    // preview 위치 설정
    this._setMiniPreviewPos(event)

    const sharedTransition = new SharedTransition({
      from: fromEl,
      to: toEl,
      duration: '.26s'
    })

    const { previewSmall, previewLarge, previewMetadata } = this.DOM
    const smallSrc = fromEl.getAttribute('src')
    const largeSrc = smallSrc.replace('w500', 'original')

    const beforePlayStart = () => {
      previewSmall.src = smallSrc

      addClass(toEl.parentNode, 'mini-expanded')

      toEl.addEventListener('mouseleave', () => {
        sharedTransition.reverse()
      }, { once: true })
    }
    const afterPlayEnd = () => {
      previewLarge.src = largeSrc
    }

    const beforeReverseStart = () => {
      removeClass(toEl.parentNode, 'mini-expanded')
    }
    const afterReverseEnd = () => {
      previewSmall.src = ''
      previewLarge.src = ''
      previewMetadata.innerHTML = ''
    }

    sharedTransition.on('beforePlayStart', beforePlayStart)
    sharedTransition.on('afterPlayEnd', afterPlayEnd)
    sharedTransition.on('beforeReverseStart', beforeReverseStart)
    sharedTransition.on('afterReverseEnd', afterReverseEnd)
    sharedTransition.play()
  }

  // _showPreview (event) {
  //   const root = document.documentElement
  //   const fromEl = event.target
  //   const toEl = this.DOM.preview
  //   const imgSmallSrc = fromEl.getAttribute('src')
  //   const imgLargeSrc = imgSmallSrc.replace('w500', 'original')

  //   const hero = new SharedTransition({
  //     from: fromEl,
  //     to: toEl
  //   })

  //   const { tracks, previewSmall, previewLarge } = this.DOM

  //   const scrollTop = root.scrollTop

  //   hero.on('beforePlayStart', () => {
  //     addStyle(tracks, {
  //       position: 'fixed',
  //       top: `${-scrollTop}px`,
  //       paddingTop: '68px'
  //     })

  //     addClass(toEl.parentNode, 'expanded')

  //     // 빠르게 이미지를 보여주기 위해 기존 작은 이미지 복사
  //     previewSmall.src = imgSmallSrc
  //   })
  //   hero.on('afterPlayEnd', () => {
  //     // 애니메이션 완료 후 큰 이미지 로드
  //     previewLarge.src = imgLargeSrc

  //     // test
  //     this.DOM.previewClose.addEventListener('click', () => {
  //       hero.reverse()
  //     }, { once: true })
  //   })

  //   hero.on('beforeReverseStart', () => {

  //   })

  //   hero.on('afterReverseEnd', () => {
  //     emptyStyle(tracks)
  //     root.scrollTop = scrollTop
  //     removeClass(toEl.parentNode, 'expanded')

  //     previewSmall.src = ''
  //     previewLarge.src = ''
  //   })

  //   hero.play()
  // }

  _getRect (elem) {
    const {
      width,
      height,
      left,
      top,
      right,
      bottom
    } = elem.getBoundingClientRect()

    return {
      width,
      height,
      left,
      top,
      right,
      bottom
    }
  }

  _hideMiniPreview (event) {
    clearTimeout(this._previewTimer)
  }
}

export default Home