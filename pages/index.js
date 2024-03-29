import Head from 'next/head'
import Image from 'next/image'
import { Dropdown, Table, Spacer, Checkbox, Radio, Button, Loading } from "@nextui-org/react";
import { useEffect, useState, useMemo } from 'react';

export default function Home() {
  const url = 'https://sociviews.com/chrono'
  // const url = 'http://localhost:3001'

  const [isLoading, setIsLoading] = useState(false);
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState([]);
  const selectedBrandText = useMemo(
    () => Array.from(selectedBrand).join(", ").replaceAll("_", " "),
    [selectedBrand]
  );

  const [displayItems, setDisplayItems] = useState([])
  const [filters, setFilters] = useState(['show-positive', 'show-negative', 'show-nochange','show-new', 'show-por'])

  const [conditions, setConditions] = useState(['New', 'Unworn', 'Very good', 'Good', 'Fair', 'Poor', 'No details']);

  const [years, setYears] = useState(['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'])

  const [showFilters, setShowFilters] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [showYears, setShowYears] = useState(false);
  /*
    NEW condition=101
    UNWORN condition=1301
    VERY GOOD condition=1302
    GOOD condition=1306
    FAIR condition=1303
    POOR condition=1304
    NO DETAILS condition=0
  */

  useEffect(() => {
    if(brands.length == 0) {
      loadData();
    }
  }, []);

  const loadData = () => {
    if(brands.length == 0) {
      loadBrands();
    }
  }

  const loadBrands =  () => {
    fetch(url+'/exports/_brands.json')
      .then((res) => res.json())
      .then((data) => {
        setBrands(data)
      })
  }

  const loadBrandData = async() => {
    // console.log(selectedBrand)
    let _brandsLoop = Array.from(selectedBrand)

    //Condition filtering
    var _condFil = '';
    for(var i=0;i<conditions.length;i++) {
      _condFil = _condFil+'&condition='+conditions[i];
    }

    //Year filtering
    var _yearFil = '';
    for(var p=0;p<years.length;p++) {
      _yearFil = _yearFil+'year='+years[p]
    }

    var _bLindex = 0
    setIsLoading(true)
    var _array = []
    while(_bLindex != _brandsLoop.length) {
        let _brand = brands.filter(b => b.name == _brandsLoop[_bLindex])
        await loadBrandDataX(_brand[0].code, (arr) => {
            _array = _array.concat(arr)
            setDisplayItems(_array)
        })
        _bLindex = _bLindex + 1;
    }

    setIsLoading(false)
  }

  const loadBrandDataY = async (name, callback) => {

  }

  const loadBrandDataX = async (name, callback) => {

    //Condition filtering
    var _condFil = '';
    for(var i=0;i<conditions.length;i++) {
      _condFil = _condFil+'&condition='+conditions[i];
    }

    //Year filtering
    var _yearFil = '';
    for(var p=0;p<years.length;p++) {
      _yearFil = _yearFil+'year='+years[p]
    }
    
    return fetch(url+'/saved?brand='+name+_condFil+_yearFil)
      .then((res) => res.json())
      .then((data) => {
        // console.log(data)
        let _mainArray = data.data.slice(data.data.length - 1, data.data.length)[0];
        let _comparationArray = data.data.slice(0, data.data.length - 1)
        // console.log(_mainArray)
        // console.log('vs')
        // console.log(_comparationArray)

        var _itemsArray = []
        for(var i=0;i<_mainArray.items.length;i++) {
          var _arrItem = _mainArray.items[i];
          // _arrItem.change = '+9% (999usd)'
          _arrItem.newprice = isNaN(_arrItem.price.split('$').join('').split(',').join('')) ? Number(-1) : Number(_arrItem.price.split('$').join('').split(',').join(''))
          _arrItem.newpricetext = _arrItem.price.split('$').join('').split(',').join('')
          // _arrItem.price = isNaN(_arrItem.price) ? _arrItem.price : Number(_arrItem.price.split('$').join('').split(',').join(''))
          // _arrItem.price = _arrItem.price.split('$').join('').split(',').join('')

          if(_comparationArray.length >= 2) {
            _arrItem.change = calculateDiff(_arrItem, _comparationArray[_comparationArray.length - 1])
          _arrItem.changetext = calculateDiff(_arrItem, _comparationArray[_comparationArray.length - 1]).text  
          }
          _arrItem.change = {value: 0, text: 'NEW'}
          _arrItem.changetext = 'NEW'
          _arrItem.minimum = calculateMinimum(_arrItem, _comparationArray)
          _arrItem.maximum = calculateMaximum(_arrItem, _comparationArray)

          let _brand = brands.filter(b => b.code == _arrItem.brand)
          _arrItem.brandName = _brand[0].name
          _itemsArray.push(_arrItem)
        }
        console.log(_itemsArray)
        callback(_itemsArray)
      })
  }

  const calculateDiff = (arrayItem, prevItem) => {
    let _prevItems = prevItem.items.filter(i => i.link == arrayItem.link);
    if(_prevItems.length == 0) {
      return {
        text: 'NEW',
        value: 0
      }
    }else if(isNaN(arrayItem.price.split('$').join('').split(',').join(''))) {
      return {
        text: 'ON REQUEST',
        value: 0
      }
    }else{
      var _originalPrice = arrayItem.price.split('$').join('').split(',').join('')
      var _yesterdaysPrice = _prevItems[0].price.split('$').join('').split(',').join('')

      // var _prefix = _originalPrice > _yesterdaysPrice ? '+' : '-';
      var _moneyDiff = _originalPrice - _yesterdaysPrice;
      var _percentageDiff = (_originalPrice * 100 /_yesterdaysPrice) - 100
      return {
        text: _percentageDiff.toFixed(2)+'% ($'+_moneyDiff+')',
        value: _moneyDiff
      }
    }
    

    
  }

  const calculateMinimum = (arrayItem, comparationArray) => {
    var minPrice =  arrayItem.price.split('$').join('').split(',').join('')
    for(var i=0;i<comparationArray.length;i++) {
      for(var j=0;j<comparationArray[i].items.length;j++) {
        if(comparationArray[i].items[j].link == arrayItem.link && comparationArray[i].items[j].price.split('$').join('').split(',').join('') < minPrice) {
          minPrice = comparationArray[i].items[j].price.split('$').join('').split(',').join('')
        }
      }
    }
    return isNaN(minPrice) ? 0 : Number(minPrice);
  }

  const calculateMaximum = (arrayItem, comparationArray) => {
    var maxPrice = arrayItem.price.split('$').join('').split(',').join('')
    for(var i=0;i<comparationArray.length;i++) {
      for(var j=0;j<comparationArray[i].items.length;j++) {
        if(comparationArray[i].items[j].link == arrayItem.link && comparationArray[i].items[j].price.split('$').join('').split(',').join('') > maxPrice) {
          maxPrice = comparationArray[i].items[j].price.split('$').join('').split(',').join('')
        }
      }
    }
    return isNaN(maxPrice) ? 0 : Number(maxPrice);
  }

  const sortBy = async (keyword) => {
    Array.prototype.orderBy = function(selector, desc = false) {
      return [...this].sort((a, b) => {
        a = selector(a);
        b = selector(b);
    
        if (a == b) return 0;
        return (desc ? a > b : a < b) ? -1 : 1;
      });
    };

    var _sorted = displayItems.orderBy(i => i[keyword])
    if(_sorted[0].link == displayItems[0].link) {
      _sorted = displayItems.orderBy(i => i[keyword], true)
    }
          setDisplayItems([])
          await setTimeout(() => {}, 1000)
          setDisplayItems(_sorted)
  }

  return (
    <main>
        <Dropdown>
          <Dropdown.Button flat>{selectedBrandText}</Dropdown.Button>
            <Dropdown.Menu
              selectedKeys={selectedBrand}
              onSelectionChange={(key) => {
                setSelectedBrand(key);
              }}
              selectionMode='multiple'
              aria-label="Static Actions">
              {
                brands.map((b, index) => {
                  return <Dropdown.Item key={b.name}>{b.name}</Dropdown.Item>
                })
              }
            </Dropdown.Menu>
        </Dropdown>
        <Spacer y={1}/>
        <Button onPress={() => {
          setShowFilters(!showFilters)
        }}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Button>
       {
        showFilters ?  <Checkbox.Group
        color="secondary"
        value={filters}
        label="Select filters"
        onChange={setFilters}
      >
        <Checkbox value="show-positive">Show + Change</Checkbox>
        <Checkbox value="show-negative">Show - Change</Checkbox>
        <Checkbox value='show-nochange'>Show no Change</Checkbox>
        <Checkbox value="show-new">Show New</Checkbox>
        <Checkbox value="show-por">Show Price on Request</Checkbox>
      </Checkbox.Group> : <div/>
       }
        <Spacer y={1}/>
        <Button onPress={() => {
          setShowConditions(!showConditions)
        }}>{showConditions ? 'Hide Conditions' : 'Show Conditions'}</Button>
        {
          showConditions ? <Checkbox.Group
          color="secondary"
          orientation='horizontal'
          value={conditions}
          label="Select condition"
          onChange={(val) => {
            setConditions(val);
          }}
        >
          <Checkbox value="New">New</Checkbox>
          <Checkbox value="Unworn">Unworn</Checkbox>
          <Checkbox value='Very good'>Very Good</Checkbox>
          <Checkbox value="Good">Good</Checkbox>
          <Checkbox value="Fair">Fair</Checkbox>
          <Checkbox value="Poor">Poor</Checkbox>
          <Checkbox value="No details">No details</Checkbox>
        </Checkbox.Group> : <div/>
        }
        <Spacer y={1}/>
        <Button onPress={() => {
          setShowYears(!showYears)
        }}>{showYears ? 'Hide Year Filter' : 'Show Year Filter'}</Button>
        {
          showYears ? <Checkbox.Group
          color="secondary"
          orientation='vertical'
          size='xs'
          value={years}
          label="Select years"
          onChange={(val) => {
            setYears(val);
          }}
        >
          <Checkbox value="2023">2023</Checkbox>
          <Checkbox value="2022">2022</Checkbox>
          <Checkbox value="2021">2021</Checkbox>
          <Checkbox value="2020">2020</Checkbox>
          <Checkbox value="2019">2019</Checkbox>
          <Checkbox value="2018">2018</Checkbox>
          <Checkbox value="2017">2017</Checkbox>
          <Checkbox value="2016">2016</Checkbox>
          <Checkbox value="2015">2015</Checkbox>
          <Checkbox value="2014">2014</Checkbox>
          <Checkbox value="2013">2013</Checkbox>
          <Checkbox value="2012">2012</Checkbox>
          <Checkbox value="2011">2011</Checkbox>
          <Checkbox value="2010">2010</Checkbox>
          <Checkbox value="Pre 2010">Pre 2010</Checkbox>
        </Checkbox.Group> : <div/>
        }
        <Spacer y={2}/>
        <Button onPress={() => {
            loadBrandData()
        }} color="success" auto>
          Search
        </Button>
       {
        isLoading ? <div>
            <Spacer y={1}/>
            <Loading size="lg"/>
        </div> :  <Table
        aria-label="Example table with static content"
        css={{
          height: "auto",
          minWidth: "100%",
        }}
      >
        <Table.Header>
          <Table.Column className='tableOnClick' onClick={() => sortBy('brandName')}>BRAND</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('model')}>MODEL</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('ref')}>REF</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('condition')}>CONDITION</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('year')}>YEAR</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('newprice')}>PRICE</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('country')}>COUNTRY</Table.Column>
          <Table.Column  className='tableOnClick' onClick={() => sortBy('changetext')}>+/- CHANGE</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('minimum')}>MIN VAL</Table.Column>
          <Table.Column className='tableOnClick' onClick={() => sortBy('maximum')}>MAX VAL</Table.Column>
        </Table.Header>
        <Table.Body>
          {
            displayItems.map((i, index) => {
              if(filters.indexOf('show-new') == -1 && i.change.text == 'NEW') {
                return null;
              }
  
              if(filters.indexOf('show-por') == -1 && i.change.text == 'ON REQUEST') {
                return null;
              }
  
              if(filters.indexOf('show-positive') == -1 && i.change.value > 0.01) {
                return null;
              }
  
              if(filters.indexOf('show-negative') == -1 && i.change.value < -0.01) {
                return null;
              }
  
              if(filters.indexOf('show-nochange') == -1 && i.change.value == 0) {
                return null;
              }

              if(conditions.indexOf(i.condition) == -1) {
                return null;
              }

              if(years.indexOf('Pre 2010') != -1) {
                if(i.year > 2010) {
                  return null;
                }
              }else{
                if(years.indexOf(i.year) == -1) {
                  return null;
                }
              }
              
              
              return <Table.Row key={index}>
              <Table.Cell><a href={i.link} target='_blank'>{i.brandName}</a></Table.Cell>
                  <Table.Cell><a href={i.link} target='_blank'>{i.model}</a></Table.Cell>
                  <Table.Cell>{i.ref}</Table.Cell>
                  <Table.Cell>{i.condition}</Table.Cell>
                  <Table.Cell>{i.year}</Table.Cell>
                  <Table.Cell>{i.newprice == -1 ? i.newpricetext : '$'+i.newprice}</Table.Cell>
                  <Table.Cell>{i.country}</Table.Cell>
                  <Table.Cell>{i.change.text}</Table.Cell>
                  <Table.Cell>${i.minimum}</Table.Cell>
                  <Table.Cell>${i.maximum}</Table.Cell>
                </Table.Row>  
              
            })
          }
        </Table.Body>
      </Table>
       }
      </main>
  )
}
