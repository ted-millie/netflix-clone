import View from './view'
import Swiper from '../lib/swiper'
import {
  repeat
} from '../helper/utils'
import {
  tmdb
} from '../services/api'

const template = `
  <div class="nc-track">
    <h2 class="nc-title">지금 뜨는 콘텐츠</h2>
    <div class="nc-inner">
      <div class="nc-swiper-container">
        <div class="nc-swiper-prev"></div>
        <div class="nc-swiper-wrapper" ref="trending">
          ${repeat('<div class="nc-swiper-slide"><a href="/"><div class="metadata">&nbsp;</div></a></div>', 12)}
        </div>
        <div class="nc-swiper-next"></div>
      </div>
    </div>
  </div>
  <div class="nc-track">
    <h2 class="nc-title">애니메이션</h2>
    <div class="nc-inner">
      <div class="nc-swiper-container">
        <div class="nc-swiper-prev"></div>
        <div class="nc-swiper-wrapper" ref="animation">
          ${repeat('<div class="nc-swiper-slide"><a href="/"><div class="metadata">&nbsp;</div></a></div>', 12)}
        </div>
        <div class="nc-swiper-next"></div>
      </div>
    </div>
  </div>
  <div class="nc-track">
    <h2 class="nc-title">로맨스</h2>
    <div class="nc-inner">
      <div class="nc-swiper-container">
        <div class="nc-swiper-prev"></div>
        <div class="nc-swiper-wrapper" ref="romance">
          ${repeat('<div class="nc-swiper-slide"><a href="/"><div class="metadata">&nbsp;</div></a></div>', 12)}
        </div>
        <div class="nc-swiper-next"></div>
      </div>
    </div>
  </div>
  <div class="nc-track">
    <h2 class="nc-title">코메디</h2>
    <div class="nc-inner">
      <div class="nc-swiper-container">
        <div class="nc-swiper-prev"></div>
        <div class="nc-swiper-wrapper" ref="comedy">
          ${repeat('<div class="nc-swiper-slide"><a href="/"><div class="metadata">&nbsp;</div></a></div>', 12)}
        </div>
        <div class="nc-swiper-next"></div>
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

  destroyed() {
    this._swiperGroup.forEach(swiper => swiper.destroy())
  }

  _renderSwipeTrending () {
    const trending = this.$refs.trending
    this.observer(trending, () => {
      tmdb.getTrending()
        .then(({ results }) => this._renderSwipe(trending, results))
    })
  }  

  _renderSwipeAnimation () {
    const animation = this.$refs.animation
    this.observer(animation, () => {
      tmdb.getPopularGenre(16)
        .then(({ results }) => this._renderSwipe(animation, results))
    })
  }

  _renderSwipeRomance () {
    const romance = this.$refs.romance
    this.observer(romance, () => {
      tmdb.getPopularGenre(10749)
        .then(({ results }) => this._renderSwipe(romance, results))
    })
  }

  _renderSwipeComedy () {
    const comedy = this.$refs.comedy
    this.observer(comedy, () => {
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
            <div class="nc-swiper-slide">
              <a href="/">
                <div class="thumbnail">
                  <img data-src="${tmdb.IMG_URL + data.backdrop_path}">
                </div>
                <div class="metadata">${data.title}</div>
              </a>
            </div>
          `)
  
          if (isLast) {
            this.lazyLoad(elem.querySelectorAll('[data-src]'), {
              threshold: 1.0
            })

            this._swiperGroup.push(
              new Swiper(elem, {
                navigation: {
                  prevEl: elem.parentNode.querySelector('.nc-swiper-prev'),
                  nextEl: elem.parentNode.querySelector('.nc-swiper-next')
                }
              })
            )

            resolve()
          }
        })
      }      
    })
  }
}

export default Home